from abc import ABC, abstractmethod
from typing import List, Dict
import anthropic
import openai


class AIProvider(ABC):
    @abstractmethod
    async def chat(self, messages: List[Dict], system_prompt: str) -> str:
        pass


class AnthropicProvider(AIProvider):
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)

    async def chat(self, messages: List[Dict], system_prompt: str) -> str:
        response = self.client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )
        return response.content[0].text


class OpenAIProvider(AIProvider):
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)

    async def chat(self, messages: List[Dict], system_prompt: str) -> str:
        all_messages = [{"role": "system", "content": system_prompt}] + messages
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=all_messages,
        )
        return response.choices[0].message.content


class GroqProvider(AIProvider):
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )

    async def chat(self, messages: List[Dict], system_prompt: str) -> str:
        all_messages = [{"role": "system", "content": system_prompt}] + messages
        response = self.client.chat.completions.create(
            model="llama3-70b-8192",
            messages=all_messages,
        )
        return response.choices[0].message.content


def get_ai_provider(provider_name: str, api_key: str) -> AIProvider:
    providers = {
        "anthropic": AnthropicProvider,
        "openai": OpenAIProvider,
        "groq": GroqProvider,
    }
    provider_class = providers.get(provider_name, AnthropicProvider)
    return provider_class(api_key)
