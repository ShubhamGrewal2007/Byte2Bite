"""
Byte2Bite Backend

"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import csv
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from database import init_db
from routers.db_health import router as db_health_router
from auth.router import router as auth_router
from routers.organizations import router as organizations_router
from routers.food import router as food_router
from routers.inventory import router as inventory_router
from routers.waste import router as waste_router
from routers.surplus import router as surplus_router
from routers.redistribution import router as redistribution_router
from routers.dashboard import router as dashboard_router


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
FRONTEND_DIR = BASE_DIR.parent / "Frontend"

REQUIRED_DATA_DIRS = [
    DATA_DIR / "synthetic" / "inventory",
    DATA_DIR / "synthetic" / "kitchen",
    DATA_DIR / "synthetic" / "consumption",
    DATA_DIR / "synthetic" / "waste",
    DATA_DIR / "synthetic" / "surplus",
    DATA_DIR / "synthetic" / "calculator",
    DATA_DIR / "redistribution",
]


# ---------------------------------------------------------------------------
# Data service
# ---------------------------------------------------------------------------
class DataService:
    """Reads JSON/CSV datasets from the backend data directory."""

    DATASET_LOCATIONS: Dict[str, str] = {
        "inventory": "synthetic/inventory",
        "kitchen": "synthetic/kitchen",
        "consumption": "synthetic/consumption",
        "waste": "synthetic/waste",
        "surplus": "synthetic/surplus",
        "calculator": "synthetic/calculator",
        "redistribution": "redistribution",
    }

    def __init__(self, data_root: Path):
        self.data_root = Path(data_root).resolve()

    def known_datasets(self) -> List[str]:
        return list(self.DATASET_LOCATIONS.keys())

    def is_known_dataset(self, name: str) -> bool:
        return name in self.DATASET_LOCATIONS

    def dataset_dir(self, name: str) -> Path:
        if name not in self.DATASET_LOCATIONS:
            raise KeyError(name)
        return self.data_root / self.DATASET_LOCATIONS[name]

    def dataset_exists(self, name: str) -> bool:
        if not self.is_known_dataset(name):
            return False
        directory = self.dataset_dir(name)
        if not directory.is_dir():
            return False
        return (
            self._find_file(directory, name, "json") is not None
            or self._find_file(directory, name, "csv") is not None
        )

    def available_formats(self, name: str) -> List[str]:
        if not self.is_known_dataset(name):
            return []

        directory = self.dataset_dir(name)
        formats: List[str] = []

        if directory.is_dir():
            if self._find_file(directory, name, "json") is not None:
                formats.append("json")
            if self._find_file(directory, name, "csv") is not None:
                formats.append("csv")

        return formats

    def load_dataset(self, name: str, fmt: str = "json") -> Dict[str, Any]:
        if not self.is_known_dataset(name):
            raise KeyError(name)

        if fmt not in ("json", "csv"):
            raise ValueError(f"Unsupported format: {fmt}")

        directory = self.dataset_dir(name)
        file_path = self._find_file(directory, name, fmt)

        if file_path is None:
            raise FileNotFoundError(
                f"Dataset '{name}' is not available in '{fmt}' format yet. "
                f"Expected a file in: {directory}"
            )

        if fmt == "json":
            loaded_data = self._read_json(file_path)
        else:
            loaded_data = self._read_csv(file_path)

        return {
            "dataset": name,
            "format": fmt,
            "source_file": str(file_path.relative_to(self.data_root)),
            "record_count": self._count_records(loaded_data, fmt),
            "data": loaded_data,
        }

    @staticmethod
    def _find_file(directory: Path, name: str, extension: str) -> Optional[Path]:
        if not directory.is_dir():
            return None

        preferred = directory / f"{name}.{extension}"
        if preferred.is_file():
            return preferred

        matches = sorted(directory.glob(f"*.{extension}"))
        return matches[0] if matches else None

    @staticmethod
    def _read_json(path: Path) -> Any:
        try:
            with path.open("r", encoding="utf-8") as file:
                return json.load(file)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON in {path.name}: {exc}") from exc

    @staticmethod
    def _read_csv(path: Path) -> List[Dict[str, str]]:
        try:
            with path.open("r", encoding="utf-8", newline="") as file:
                reader = csv.DictReader(file)
                return [dict(row) for row in reader]
        except csv.Error as exc:
            raise ValueError(f"Invalid CSV in {path.name}: {exc}") from exc

    @staticmethod
    def _count_records(loaded_data: Any, fmt: str) -> int:
        if fmt == "csv":
            return len(loaded_data) if isinstance(loaded_data, list) else 0
        if isinstance(loaded_data, list):
            return len(loaded_data)
        if isinstance(loaded_data, dict):
            return 1
        return 0


# ---------------------------------------------------------------------------
# API routers
# ---------------------------------------------------------------------------
health_router = APIRouter()
info_router = APIRouter()
data_router = APIRouter()


@health_router.get("/health")
def health_check(request: Request):
    data_service_ready = hasattr(request.app.state, "data_service")
    return {
        "status": "ok",
        "service": "food-waste-backend",
        "task": "Task 1 - Backend Foundation",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data_service_ready": data_service_ready,
        "message": "Backend is running and healthy.",
    }


@info_router.get("")
def api_info():
    return {
        "name": "Byte2Bite Backend",
        "description": (
            "Unified data service for an institutional food-waste "
            "management and redistribution system."
        ),
        "task": "Task 1 - Backend Foundation",
        "version": "0.1.0",
        "status": "running",
        "documentation": {
            "swagger_ui": "/docs",
            "openapi_json": "/openapi.json",
            "redoc": "/redoc",
        },
        "frontends_served": [
            {
                "name": "AI Model Page",
                "description": "Will consume synthetic operational data.",
            },
            {
                "name": "Analytics Page",
                "description": "Will consume operational data for analytics.",
            },
            {
                "name": "Main Frontend / Redistribution Map",
                "description": "Will consume redistribution data.",
            },
        ],
        "modules": {
            "health": {
                "endpoint": "/api/health",
                "description": "Backend health/status check.",
                "implemented": True,
            },
            "data": {
                "endpoint": "/api/data",
                "description": "Generic JSON/CSV data-serving layer.",
                "implemented": True,
                "planned_datasets": list(DataService.DATASET_LOCATIONS.keys()),
            },
        },
        "notes": [
            "Task 1 implements only the backend foundation.",
            "No AI/ML, analytics, or redistribution logic is implemented yet.",
            "Datasets will be populated in later tasks.",
        ],
    }


def _get_data_service(request: Request) -> DataService:
    service = getattr(request.app.state, "data_service", None)
    if service is None:
        raise HTTPException(
            status_code=503,
            detail="Data service is not initialized. Backend may still be starting up.",
        )
    return service


@data_router.get("")
def list_datasets(request: Request):
    service = _get_data_service(request)
    datasets = []

    for name in service.known_datasets():
        datasets.append(
            {
                "name": name,
                "available": service.dataset_exists(name),
                "formats": service.available_formats(name),
                "endpoint": f"/api/data/{name}",
            }
        )

    return {
        "message": "Available datasets and their status.",
        "note": (
            "In Task 1, datasets may be empty/unavailable. "
            "They will be populated in later tasks."
        ),
        "datasets": datasets,
    }


@data_router.get("/{dataset_name}")
def get_dataset(
    dataset_name: str,
    request: Request,
    format: str = "json",
):
    service = _get_data_service(request)

    if not service.is_known_dataset(dataset_name):
        raise HTTPException(
            status_code=404,
            detail=(
                f"Unknown dataset '{dataset_name}'. "
                f"Known datasets: {service.known_datasets()}"
            ),
        )

    if format not in ("json", "csv"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported format. Use 'json' or 'csv'.",
        )

    try:
        return service.load_dataset(dataset_name, fmt=format)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load dataset '{dataset_name}': {exc}",
        )


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    for directory in REQUIRED_DATA_DIRS:
        directory.mkdir(parents=True, exist_ok=True)

    app.state.data_service = DataService(data_root=DATA_DIR)
    init_db()

    print("=" * 60)
    print(" Byte2Bite Backend (Task 1 Foundation) started")
    print(f" Data root: {DATA_DIR}")
    print(f" Frontend:  {FRONTEND_DIR}")
    print(" Docs:      http://127.0.0.1:8000/docs")
    print("=" * 60)

    yield

    print(" Byte2Bite Backend shutting down.")


app = FastAPI(
    title="Byte2Bite Backend",
    description=(
        "Task 1 foundation backend for the Byte2Bite institutional "
        "food-waste management and redistribution system."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5500",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(info_router, prefix="/api", tags=["Info"])
app.include_router(data_router, prefix="/api/data", tags=["Data"])
app.include_router(db_health_router, prefix="/api", tags=["Database"])
app.include_router(auth_router)
app.include_router(organizations_router)
app.include_router(food_router)
app.include_router(inventory_router)
app.include_router(waste_router)
app.include_router(surplus_router)
app.include_router(redistribution_router)
app.include_router(dashboard_router)


# ---------------------------------------------------------------------------
# Frontend (static files)
# ---------------------------------------------------------------------------
# Serve the existing Frontend/ directory through the same FastAPI service.
# FRONTEND_DIR is resolved from this file's location, so the mount works on
# Linux/Render regardless of the process working directory.
# All API routes and the FastAPI docs (/docs, /openapi.json, /redoc) were
# registered above and therefore take precedence over the static mount.
# ---------------------------------------------------------------------------

@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirect the root path to the existing Dashboard entry page."""
    return RedirectResponse(url="/Dashboard/Dashboard.html", status_code=307)


if FRONTEND_DIR.is_dir():
    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_DIR), html=True),
        name="frontend",
    )
