from pydantic import BaseModel
from typing import List, Dict, Any


class KPIMetrics(BaseModel):
    leads: int
    appointments: int
    avg_ticket: float
    flows_triggered: int


class TimeSeriesPoint(BaseModel):
    date: str
    value: float
    channel: str = ""


class RevenuePoint(BaseModel):
    period: str
    revenue: float
    profit: float


class SourceCount(BaseModel):
    source: str
    count: int


class HeatmapCell(BaseModel):
    day: int
    hour: int
    count: int


class ArtistRanking(BaseModel):
    artist_id: str
    name: str
    revenue: float
    sessions: int
    avg_ticket: float
