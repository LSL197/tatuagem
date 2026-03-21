import asyncio
import time
from typing import Dict, Any
from app.workers.celery_app import celery_app
from app.database import SessionLocal
from app.models.automation import Automation, FlowExecution, ExecutionStatus
from app.models.lead import Lead, LeadSource
from app.services.ai_provider import get_ai_provider
from app.services.prompts import QUALIFICATION_PROMPT
from app.config import settings


def execute_flow(flow_json: dict, context: Dict[str, Any]) -> list:
    nodes = {n["id"]: n for n in flow_json.get("nodes", [])}
    edges = flow_json.get("edges", [])

    adjacency = {}
    for edge in edges:
        src = edge["source"]
        adjacency.setdefault(src, []).append(edge["target"])

    trigger_nodes = [n for n in flow_json.get("nodes", []) if n["data"].get("type") == "TriggerNode"]
    if not trigger_nodes:
        return [{"step": "error", "message": "Nenhum TriggerNode encontrado"}]

    current_id = trigger_nodes[0]["id"]
    logs = []
    visited = set()

    while current_id and current_id not in visited:
        visited.add(current_id)
        node = nodes.get(current_id)
        if not node:
            break

        node_type = node["data"].get("type")
        node_data = node["data"]
        log_entry = {"node_id": current_id, "type": node_type}

        if node_type == "TriggerNode":
            log_entry["action"] = "triggered"

        elif node_type == "MessageNode":
            message = node_data.get("message", "")
            phone = context.get("phone")
            if phone:
                from app.services.whatsapp import send_message
                asyncio.run(send_message(phone, message))
            log_entry["action"] = "message_sent"
            log_entry["message"] = message

        elif node_type == "DelayNode":
            delay_minutes = node_data.get("delay_minutes", 1)
            time.sleep(min(delay_minutes * 60, 30))
            log_entry["action"] = f"delayed_{delay_minutes}m"

        elif node_type == "ActionNode":
            action = node_data.get("action")
            if action == "save_lead":
                db = SessionLocal()
                try:
                    lead = Lead(
                        name=context.get("name", "Desconhecido"),
                        phone=context.get("phone", ""),
                        source=LeadSource.whatsapp,
                    )
                    db.add(lead)
                    db.commit()
                    log_entry["action"] = "lead_saved"
                finally:
                    db.close()

        elif node_type == "AIAgentNode":
            prompt = node_data.get("prompt", QUALIFICATION_PROMPT)
            user_message = context.get("message", "")
            provider = get_ai_provider("anthropic", settings.anthropic_api_key)
            response = asyncio.run(provider.chat(
                [{"role": "user", "content": user_message}],
                prompt,
            ))
            phone = context.get("phone")
            if phone:
                from app.services.whatsapp import send_message
                asyncio.run(send_message(phone, response))
            log_entry["action"] = "ai_response_sent"
            context["ai_response"] = response

        elif node_type == "ConditionNode":
            condition_key = node_data.get("condition_key", "message")
            condition_value = node_data.get("condition_value", "")
            value = str(context.get(condition_key, "")).lower()
            matches = condition_value.lower() in value
            log_entry["action"] = f"condition_{'true' if matches else 'false'}"

            next_nodes = adjacency.get(current_id, [])
            if next_nodes:
                current_id = next_nodes[0] if matches else (next_nodes[1] if len(next_nodes) > 1 else None)
            else:
                current_id = None
            logs.append(log_entry)
            continue

        logs.append(log_entry)
        next_nodes = adjacency.get(current_id, [])
        current_id = next_nodes[0] if next_nodes else None

    return logs


@celery_app.task(name="app.workers.flow_engine.run_flow")
def run_flow(automation_id: str, context: Dict[str, Any]):
    db = SessionLocal()
    try:
        automation = db.query(Automation).filter(Automation.id == automation_id).first()
        if not automation or not automation.active:
            return

        execution = FlowExecution(
            automation_id=automation.id,
            triggered_by=context.get("phone", "unknown"),
            status=ExecutionStatus.running,
        )
        db.add(execution)
        db.commit()

        try:
            logs = execute_flow(automation.flow_json, context)
            execution.status = ExecutionStatus.completed
            execution.logs = logs
        except Exception as e:
            execution.status = ExecutionStatus.failed
            execution.logs = [{"error": str(e)}]

        db.commit()
    finally:
        db.close()
