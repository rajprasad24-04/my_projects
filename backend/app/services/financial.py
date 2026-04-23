"""
Pure financial math functions — no I/O, no side effects.
All formulas for investment planning calculations.
"""

from __future__ import annotations
import math


def lumpsum_fv(principal: float, annual_rate_pct: float, years: int) -> float:
    """Future value of a lumpsum investment."""
    if annual_rate_pct == 0:
        return principal
    r = annual_rate_pct / 100.0
    return principal * math.pow(1.0 + r, years)


def sip_fv(monthly_sip: float, annual_rate_pct: float, years: int) -> float:
    """Future value of monthly SIP (annuity-due)."""
    if annual_rate_pct == 0:
        return monthly_sip * years * 12
    r_m = annual_rate_pct / 100.0 / 12.0
    n = years * 12
    gf = math.pow(1.0 + r_m, n)
    return monthly_sip * ((gf - 1.0) / r_m) * (1.0 + r_m)


def sip_needed_for_fv(fv_target: float, annual_rate_pct: float, years: int) -> float:
    """Monthly SIP needed to reach a future value target."""
    if annual_rate_pct == 0:
        return fv_target / (years * 12)
    r_m = annual_rate_pct / 100.0 / 12.0
    n = years * 12
    gf = math.pow(1.0 + r_m, n)
    return fv_target / (((gf - 1.0) / r_m) * (1.0 + r_m))


def pv_of_fv(fv: float, annual_rate_pct: float, years: int) -> float:
    """Present value of a future amount."""
    if annual_rate_pct == 0:
        return fv
    r = annual_rate_pct / 100.0
    return fv / math.pow(1.0 + r, years)


def evaluate_split(
    w_l: float,
    lumpsum: float,
    sip: float,
    target: float,
    years: int,
    rate_st: float,
) -> dict:
    """
    Evaluate a lumpsum/SIP split against a target.
    w_l = percentage of target funded by lumpsum (0-100)
    """
    w_s = 100.0 - w_l
    fv_target_lumpsum = (w_l / 100.0) * target
    fv_target_sip = (w_s / 100.0) * target

    lumpsum_needed = pv_of_fv(fv_target_lumpsum, rate_st, years)
    sip_needed = sip_needed_for_fv(fv_target_sip, rate_st, years) if fv_target_sip > 0 else 0.0

    lumpsum_surplus = lumpsum - lumpsum_needed
    sip_surplus = sip - sip_needed
    lumpsum_ok = lumpsum_surplus >= -0.01
    sip_ok = sip_surplus >= -0.01

    return {
        "w_l": w_l,
        "w_s": w_s,
        "fv_target_lumpsum": fv_target_lumpsum,
        "fv_target_sip": fv_target_sip,
        "lumpsum_needed": lumpsum_needed,
        "sip_needed": sip_needed,
        "lumpsum_surplus": lumpsum_surplus,
        "sip_surplus": sip_surplus,
        "lumpsum_ok": lumpsum_ok,
        "sip_ok": sip_ok,
        "both_ok": lumpsum_ok and sip_ok,
        "st_lumpsum": lumpsum_needed,
        "st_sip": sip_needed,
        "core_lumpsum": max(0.0, lumpsum_surplus),
        "core_sip": max(0.0, sip_surplus),
    }


def auto_suggest(
    lumpsum: float,
    sip: float,
    target: float,
    years: int,
    rate_st: float,
) -> dict:
    """
    Find the valid weight range and sweet spot split.
    """
    fv_full_lumpsum = lumpsum_fv(lumpsum, rate_st, years)
    fv_full_sip = sip_fv(sip, rate_st, years)

    w_max_raw = (fv_full_lumpsum / target) * 100.0
    w_min_raw = 100.0 - (fv_full_sip / target) * 100.0
    w_max = min(100.0, w_max_raw)
    w_min = max(0.0, w_min_raw)
    valid_range_exists = w_min <= w_max

    result = {
        "fv_full_lumpsum": fv_full_lumpsum,
        "fv_full_sip": fv_full_sip,
        "w_min": w_min,
        "w_max": w_max,
        "valid_range_exists": valid_range_exists,
    }

    if valid_range_exists:
        w_sweet = (w_min + w_max) / 2.0
        result["w_sweet"] = w_sweet
        result["sweet"] = evaluate_split(w_sweet, lumpsum, sip, target, years, rate_st)
        result["at_min"] = evaluate_split(w_min, lumpsum, sip, target, years, rate_st)
        result["at_max"] = evaluate_split(w_max, lumpsum, sip, target, years, rate_st)
    else:
        result["w_sweet"] = None
        result["combined_shortfall"] = max(0.0, target - fv_full_lumpsum - fv_full_sip)

    return result