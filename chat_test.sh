#!/bin/bash
# Simulador de conversa WhatsApp para testar o agente SDR
# Uso: ./chat_test.sh [phone]

PHONE=${1:-"5591999999999"}
API="http://localhost:8000/api/v1/webhooks/whatsapp"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SDR Agent — Império Ink"
echo "  Simulando WhatsApp de: $PHONE"
echo "  Digite 'sair' para encerrar"
echo "  Digite 'historico' para ver o banco"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

while true; do
    # Lê a mensagem do usuário
    printf "Você: "
    read -r msg

    # Comandos especiais
    if [[ "$msg" == "sair" ]]; then
        echo "Encerrando..."
        break
    fi

    if [[ "$msg" == "historico" ]]; then
        echo ""
        echo "--- Lead ---"
        docker-compose exec -T db psql -U postgres tatuagem -c \
            "SELECT name, phone, tags FROM leads WHERE phone = '$PHONE';" 2>/dev/null
        echo "--- Conversa ---"
        docker-compose exec -T db psql -U postgres tatuagem -c \
            "SELECT awaiting_handoff, jsonb_array_length(messages::jsonb) as num_msgs FROM ai_conversations WHERE phone = '$PHONE';" 2>/dev/null
        echo ""
        continue
    fi

    if [[ -z "$msg" ]]; then
        continue
    fi

    # Envia para o webhook
    RESPONSE=$(curl -s -X POST "$API" \
        -H "Content-Type: application/json" \
        -d "{
            \"entry\": [{
                \"changes\": [{
                    \"value\": {
                        \"messages\": [{
                            \"type\": \"text\",
                            \"from\": \"$PHONE\",
                            \"text\": {\"body\": $(echo "$msg" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().strip()))')}
                        }]
                    }
                }]
            }]
        }")

    # Busca a última resposta da IA no banco
    INK=$(docker-compose exec -T db psql -U postgres tatuagem -t -c \
        "SELECT messages->-1->>'content' FROM ai_conversations WHERE phone = '$PHONE' ORDER BY created_at DESC LIMIT 1;" 2>/dev/null | xargs)

    if [[ -n "$INK" ]]; then
        echo ""
        echo "Ink: $INK"
        echo ""
    else
        echo ""
        echo "[sem resposta — verifique os logs: docker-compose logs backend]"
        echo ""
    fi
done
