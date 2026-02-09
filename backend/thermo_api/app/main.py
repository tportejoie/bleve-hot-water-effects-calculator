from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from iapws import IAPWS97
from pydantic import BaseModel


class ThermoPropertiesResponse(BaseModel):
    pressure: float
    temperature: float
    h_l: float
    h_v: float
    rho_l: float
    rho_v: float
    s_l: float
    s_v: float
    u_l: float
    u_v: float


app = FastAPI(title="Thermo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _healthz() -> dict[str, str]:
    return {"status": "ok"}


def _thermo_properties(
    pressure_pa: float = Query(..., alias="pressurePa", gt=0),
) -> ThermoPropertiesResponse:
    pressure_mpa = pressure_pa / 1_000_000.0

    try:
        liquid = IAPWS97(P=pressure_mpa, x=0)
        vapor = IAPWS97(P=pressure_mpa, x=1)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Pressure {pressure_pa / 100000:.3f} bar(abs) is outside IAPWS saturation range.",
        ) from exc

    return ThermoPropertiesResponse(
        pressure=pressure_pa,
        temperature=float(liquid.T),
        h_l=float(liquid.h * 1000.0),
        h_v=float(vapor.h * 1000.0),
        rho_l=float(1.0 / liquid.v),
        rho_v=float(1.0 / vapor.v),
        s_l=float(liquid.s * 1000.0),
        s_v=float(vapor.s * 1000.0),
        u_l=float(liquid.u * 1000.0),
        u_v=float(vapor.u * 1000.0),
    )


@app.get("/healthz")
@app.get("/api/healthz")
def healthz() -> dict[str, str]:
    return _healthz()


@app.get("/thermo/properties", response_model=ThermoPropertiesResponse)
@app.get("/api/thermo/properties", response_model=ThermoPropertiesResponse)
def thermo_properties(
    pressure_pa: float = Query(..., alias="pressurePa", gt=0),
) -> ThermoPropertiesResponse:
    return _thermo_properties(pressure_pa=pressure_pa)
