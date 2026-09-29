# Pluto and Ceres Horizons fit research

This directory preserves the raw NASA/JPL Horizons responses used to derive and validate a local six-element linear fit for 1800–2050. No project source files are modified.

## Raw files

- `horizons-ceres-elements-1800-2050-1y.txt`: 251 annual geometric osculating-element rows for 1 Ceres.
- `horizons-pluto-elements-1800-2050-1y.txt`: 251 annual geometric osculating-element rows for Pluto's center.
- `fit-validation.json`: fitted coefficients and annual-checkpoint errors.
- `reproduce-fit.mjs`: dependency-free parser, fitter, two-body evaluator, and validation calculator. It prints one JSON object per body.

## Exact API requests

Common endpoint: `https://ssd.jpl.nasa.gov/api/horizons.api`

Common parameters:

```text
format=text
OBJ_DATA='NO'
MAKE_EPHEM='YES'
EPHEM_TYPE='ELEMENTS'
CENTER='500@10'
STEP_SIZE='1y'
REF_PLANE='ECLIPTIC'
REF_SYSTEM='ICRF'
OUT_UNITS='AU-D'
CSV_FORMAT='YES'
```

Ceres-specific parameters:

```text
COMMAND='1;'
START_TIME='1800-01-01'
STOP_TIME='2050-01-02'
```

Exact Ceres URL:

```text
https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND=%271%3B%27&OBJ_DATA=%27NO%27&MAKE_EPHEM=%27YES%27&EPHEM_TYPE=%27ELEMENTS%27&CENTER=%27500%4010%27&START_TIME=%271800-01-01%27&STOP_TIME=%272050-01-02%27&STEP_SIZE=%271y%27&REF_PLANE=%27ECLIPTIC%27&REF_SYSTEM=%27ICRF%27&OUT_UNITS=%27AU-D%27&CSV_FORMAT=%27YES%27
```

Pluto-specific parameters:

```text
COMMAND='999'
START_TIME='1800-01-03'
STOP_TIME='2050-01-04'
```

Pluto starts on January 3 because Horizons reported no target-999 ephemeris before `1800-Jan-03 00:00 TDB` for the active PLU060 solution.

Exact Pluto URL:

```text
https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND=%27999%27&OBJ_DATA=%27NO%27&MAKE_EPHEM=%27YES%27&EPHEM_TYPE=%27ELEMENTS%27&CENTER=%27500%4010%27&START_TIME=%271800-01-03%27&STOP_TIME=%272050-01-04%27&STEP_SIZE=%271y%27&REF_PLANE=%27ECLIPTIC%27&REF_SYSTEM=%27ICRF%27&OUT_UNITS=%27AU-D%27&CSV_FORMAT=%27YES%27
```

## Reproduction

Run:

```bash
node reproduce-fit.mjs
```

The fit uses Julian centuries from J2000.0 and stores `[a, e, I, L, varpi, Omega]`. Angular series are unwrapped before independent ordinary least-squares regression. Validation is at the 251 source epochs; reported maxima are sampled maxima, not guaranteed continuous-time error bounds.

The raw response headers include the Horizons API version, query execution time, target and center solution identifiers, reference frame, units, and output definitions. Horizons data are live products; a future re-query can differ if JPL updates an orbit solution.
