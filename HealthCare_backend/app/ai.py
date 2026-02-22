import re
from typing import List, Optional, Tuple, Dict

# Common patterns like:
# Hemoglobin  11.2 g/dL  13.0 - 17.0
# LDL Cholesterol  165 mg/dL  < 100
# Glucose  110 mg/dL  70 - 99
#
# We will try multiple patterns because labs vary.

NUM = r"(-?\d+(?:\.\d+)?)"
RANGE = rf"({NUM}\s*[-–]\s*{NUM}|<\s*{NUM}|>\s*{NUM})"
UNIT = r"([a-zA-Z/%µμ]+(?:/[a-zA-Z]+)?)"

def _to_float(s: str) -> Optional[float]:
    try:
        return float(s)
    except:
        return None

def _parse_ref_range(ref: str) -> Tuple[Optional[float], Optional[float]]:
    ref = ref.strip()

    # "13.0 - 17.0"
    m = re.search(rf"{NUM}\s*[-–]\s*{NUM}", ref)
    if m:
        low = _to_float(m.group(1))
        high = _to_float(m.group(2))
        return low, high

    # "< 100"
    m = re.search(rf"<\s*{NUM}", ref)
    if m:
        high = _to_float(m.group(1))
        return None, high

    # "> 5.0"
    m = re.search(rf">\s*{NUM}", ref)
    if m:
        low = _to_float(m.group(1))
        return low, None

    return None, None

def _interpret(value: Optional[float], low: Optional[float], high: Optional[float]) -> str:
    if value is None:
        return "unknown"
    if low is not None and value < low:
        return "low"
    if high is not None and value > high:
        return "high"
    if low is not None or high is not None:
        return "normal"
    return "unknown"

def extract_lab_results(text: str) -> List[Dict]:
    """
    Extract as many lab rows as possible from the PDF text.
    Strategy:
    - Go line by line
    - Try to detect: TEST NAME + VALUE + UNIT (optional) + REF RANGE (optional)
    """
    results = []
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    seen = set()

    # Pattern A: "Test Name  11.2  g/dL  13.0 - 17.0"
    pat_a = re.compile(rf"^(?P<test>[A-Za-z][A-Za-z0-9 ()/.,\-]+?)\s+"
                       rf"(?P<value>{NUM})\s*"
                       rf"(?P<unit>{UNIT})?\s+"
                       rf"(?P<ref>{RANGE}.*)$")

    # Pattern B: "Test Name  110  70 - 99"  (no unit)
    pat_b = re.compile(rf"^(?P<test>[A-Za-z][A-Za-z0-9 ()/.,\-]+?)\s+"
                       rf"(?P<value>{NUM})\s+"
                       rf"(?P<ref>{RANGE}.*)$")

    # Pattern C: "Test Name : 11.2 g/dL (13-17)"
    pat_c = re.compile(rf"^(?P<test>[A-Za-z][A-Za-z0-9 ()/.,\-]+?)\s*[:\-]\s*"
                       rf"(?P<value>{NUM})\s*"
                       rf"(?P<unit>{UNIT})?\s*"
                       rf"[\(\[]?(?P<ref>{RANGE}.*)?[\)\]]?$")

    for ln in lines:
        m = pat_a.match(ln) or pat_b.match(ln) or pat_c.match(ln)
        if not m:
            continue

        test = m.group("test").strip()
        value_raw = m.group("value").strip()
        value = _to_float(value_raw)

        unit = None
        if "unit" in m.groupdict() and m.group("unit"):
            unit = m.group("unit").strip()

        ref_raw = None
        if "ref" in m.groupdict() and m.group("ref"):
            ref_raw = m.group("ref").strip()

        low, high = (None, None)
        if ref_raw:
            low, high = _parse_ref_range(ref_raw)

        interp = _interpret(value, low, high)

        key = (test.lower(), value_raw, ref_raw or "")
        if key in seen:
            continue
        seen.add(key)

        results.append({
            "test": test,
            "value": value,
            "value_raw": value_raw,
            "unit": unit,
            "ref_low": low,
            "ref_high": high,
            "ref_raw": ref_raw,
            "interpretation": interp
        })

    return results

def summarize_results(results: List[Dict]) -> Tuple[List[str], str]:
    lows = [r for r in results if r["interpretation"] == "low"]
    highs = [r for r in results if r["interpretation"] == "high"]
    unknown = [r for r in results if r["interpretation"] == "unknown"]

    flags = []
    for r in lows[:10]:
        flags.append(f"{r['test']} low")
    for r in highs[:10]:
        flags.append(f"{r['test']} high")

    if not results:
        return (["No lab values detected"], "Could not extract lab values from the PDF text. The report may be scanned (image-based).")

    if not flags and results:
        # All normal OR could not interpret because no ranges
        if unknown and not (lows or highs):
            return (["Reference range missing for some tests"], "Values were extracted, but reference ranges were missing/unclear for some tests.")
        return (["All extracted parameters appear within range"], "All extracted parameters appear within normal limits based on the reference ranges found in the report.")

    summary_parts = []
    if lows:
        summary_parts.append(f"{len(lows)} low")
    if highs:
        summary_parts.append(f"{len(highs)} high")
    if unknown:
        summary_parts.append(f"{len(unknown)} unknown-range")

    summary = "Abnormal results detected (" + ", ".join(summary_parts) + ")."
    return (flags, summary)
