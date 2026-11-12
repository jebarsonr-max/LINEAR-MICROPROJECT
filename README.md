# BrightInt — Calculating the Total Change in Image Brightness Using Integration

> **College Project for Linear Algebra and Multivariable Calculus**  
> A full-stack educational web application demonstrating how a digital image is modeled as a real matrix $A = [a_{ij}] \in \mathbb{R}^{m \times n}$, how pixel brightness is mathematically analyzed via photopic weighting, and how numerical summation evaluates the continuous double integral $\iint_D B(x, y) \, dA$.

---

## 📑 Table of Contents
1. [Architecture & Technology Stack](#-architecture--technology-stack)
2. [Project Directory Layout](#-project-directory-layout)
3. [Mathematical Foundations](#-mathematical-foundations)
   - [Continuous Surface Double Integral](#1-continuous-surface-double-integral)
   - [Discrete Pixel Riemann Summation](#2-discrete-pixel-riemann-summation)
   - [Photometric Luminance (ITU-R BT.601)](#3-photometric-luminance-itu-r-bt601)
   - [Average Brightness & Mean Value Theorem](#4-average-brightness--mean-value-theorem)
   - [Region-Based Integration (ROI)](#5-region-based-integration-roi)
   - [What-If Affine Luminance Transformation](#6-what-if-affine-luminance-transformation)
4. [Verified Academic Benchmark](#-verified-academic-benchmark)
5. [Setup & Running Instructions](#-setup--running-instructions)
   - [Windows Setup (PowerShell / Command Prompt)](#windows-setup)
   - [macOS / Linux Setup (Bash / Zsh)](#macos--linux-setup)
6. [API Specification & REST Endpoints](#-api-specification--rest-endpoints)
7. [Automated Verification Tests](#-automated-verification-tests)
8. [College Viva Voce Defense Guide](#-college-viva-voce-defense-guide)

---

## 🏛️ Architecture & Technology Stack

BrightInt is engineered as a decoupled, local full-stack platform:

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom **Scientific Light Theme** design system
- **3D Visualization**: Three.js WebGL surface mesh with OrbitControls
- **2D Visualizations**: HTML5 Canvas Photometric Heatmap (Viridis, Inferno, Turbo, Grayscale), 256-Bin Histogram, and 1D Row/Col Slice Profiles
- **HTTP Client**: Axios with fallback handling for local offline execution

### Backend
- **Runtime**: Python 3.11+ (verified on Python 3.14)
- **Web Framework**: FastAPI with Starlette ASGI runtime
- **ASGI Server**: Uvicorn
- **Numerical Processing**: NumPy (float32 matrix manipulation and 64-bit summation)
- **Image Processing**: Pillow (PIL) for image decoding and alpha compositing
- **Validation**: Pydantic v2
- **PDF Generation**: ReportLab for formal academic PDF reports
- **Testing**: Pytest & AnyIO

### Database
- **Engine**: SQLite (`brightint.db`)
- **ORM**: SQLAlchemy 2.0 with parameterized operations
- **Storage Strategy**: Scalar metadata, 256-bin histogram distributions, and thumbnails are persisted in SQLite; full-resolution float32 luminance matrices are held in an in-memory session cache to eliminate redundant disk I/O.

---

## 📂 Project Directory Layout

```
LINEAR MICROPROJECT/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application, CORS, lifespan startup
│   │   ├── config.py               # Application settings & limits
│   │   ├── database.py             # SQLAlchemy engine & session factory
│   │   ├── models.py               # SQLite AnalysisRecord table model
│   │   ├── schemas.py              # Pydantic request/response validation
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── analysis.py         # /api/analyze, /api/integrate, /api/simulate
│   │   │   ├── history.py          # /api/history (CRUD operations)
│   │   │   └── reports.py          # /api/reports/{id} (PDF export)
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── cache.py            # In-memory float32 luminance matrix session cache
│   │       ├── image_processor.py  # Pillow decoding & alpha compositing
│   │       ├── integration.py      # NumPy double integration & ROI sub-domain math
│   │       ├── simulator.py        # Affine transfer function & delta calculations
│   │       └── report_generator.py # ReportLab PDF generator
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_backend.py         # Pytest suite (9 tests)
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/             # Sidebar, Header, StatCard, FormulaCard, Dropzone
│   │   │   ├── Overview/           # Overview dashboard & sample loaders
│   │   │   ├── Analyzer/           # Side-by-side view, drag-to-select ROI, pixel probe
│   │   │   ├── IntegrationLab/     # Discrete vs Continuous, 7-stage pipeline, 3x3 matrix
│   │   │   ├── Visualizations/     # 3D surface, heatmaps, 256-bin histogram, profiles
│   │   │   ├── Simulator/          # Brightness & contrast sliders, dual histogram
│   │   │   ├── LinearAlgebra/      # Matrix workbench (3x3, 4x4, 5x5) & Viva guide
│   │   │   ├── Reports/            # Academic printable report
│   │   │   └── History/            # SQLite persistent history & PDF downloads
│   │   ├── services/
│   │   │   └── api.ts              # Axios backend communication & PDF trigger
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript interfaces
│   │   ├── utils/
│   │   │   ├── mathEngine.ts       # Mathematical calculations & tests
│   │   │   ├── mathEngine.test.ts  # Vitest test suite (7 tests)
│   │   │   └── imageProcessor.ts   # Canvas image processing & sample patterns
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── README.md
└── .gitignore
```

---

## 📐 Mathematical Foundations

### 1. Continuous Surface Double Integral
Let continuous domain $D \subset \mathbb{R}^2$ represent the spatial extent of an image bounded by $[0, W] \times [0, H]$. The photometric luminance at spatial coordinates $(x, y) \in D$ is defined by the scalar elevation function $B(x, y)$.

The **Total Luminous Flux** passing through aperture domain $D$ is given by:
$$T = \iint_D B(x, y) \, dA = \int_0^H \int_0^W B(x, y) \, dx \, dy$$

### 2. Discrete Pixel Riemann Summation
When an analog optical scene is sampled onto an $m \times n$ digital sensor:
- The domain is partitioned into $m \cdot n$ disjoint rectangular sub-elements $\Delta A_{ij} = \Delta x \cdot \Delta y$.
- In digital pixel units, each pixel represents a normalized unit area: $\Delta A = 1$.

The discrete Riemann double sum is given by:
$$T \approx \sum_{i=1}^m \sum_{j=1}^n B(i, j) \cdot \Delta A = \sum_{i=1}^m \sum_{j=1}^n B(i, j)$$
As spatial sampling density approaches infinity ($m, n \to \infty$ and $\Delta A \to 0$), the discrete matrix sum converges directly to the continuous double integral.

### 3. Photometric Luminance (ITU-R BT.601)
Human visual perception does not respond equally to all electromagnetic wavelengths. Under daylight (photopic) conditions, retinal cone cells exhibit peak spectral sensitivity near 555 nm (green light).

The standard ITU-R BT.601 photopic weighting projects the 3-channel RGB vector into a scalar luminance field:
$$\text{Gray}(i, j) = 0.299 \cdot R(i, j) + 0.587 \cdot G(i, j) + 0.114 \cdot B(i, j)$$
- Intensity scale: $0 = \text{pure black}$, $255 = \text{specular white}$.
- Numerical accumulation is evaluated using 64-bit float precision before any display quantization.
- Transparent alpha pixels are composited over a reference pure white background $(255, 255, 255)$:
  $$\text{RGB}_{\text{comp}} = \text{RGB} \cdot \alpha + (255, 255, 255) \cdot (1 - \alpha)$$

### 4. Average Brightness & Mean Value Theorem
By the Mean Value Theorem for multiple integrals, the uniform height $\bar{B}$ that encloses an equivalent integral volume over region $D$ is:
$$\bar{B} = \frac{1}{|D|} \iint_D B(x, y) \, dA \approx \frac{T}{m \cdot n}$$

The **Normalized Average Brightness Percentage** is:
$$B_{\text{norm}} = \left( \frac{\bar{B}}{255} \right) \times 100\%$$

### 5. Region-Based Integration (ROI)
For a rectangular subregion $D_{\text{sub}} = [x_1, x_2] \times [y_1, y_2] \subset D$:
$$T_{\text{ROI}} = \iint_{D_{\text{sub}}} B(x, y) \, dA \approx \sum_{i=y_1}^{y_2} \sum_{j=x_1}^{x_2} B(i, j)$$
$$\bar{B}_{\text{ROI}} = \frac{T_{\text{ROI}}}{(x_2 - x_1 + 1)(y_2 - y_1 + 1)}$$

### 6. What-If Affine Luminance Transformation
Dynamic simulations apply an affine transformation to the original scalar matrix:
$$I_{\text{new}}(i, j) = \text{clamp}\left( c \cdot (I_{\text{orig}}(i, j) - 127.5) + 127.5 + \Delta b, \, 0, \, 255 \right)$$
where $c$ is the contrast multiplier and $\Delta b$ is the additive brightness offset.

The resulting calculus deltas are:
$$\Delta T = T_{\text{new}} - T_{\text{orig}}$$
$$\Delta \bar{B} = \bar{B}_{\text{new}} - \bar{B}_{\text{orig}}$$
$$\%\Delta = \begin{cases} \left( \frac{\Delta T}{T_{\text{orig}}} \right) \times 100\%, & \text{if } T_{\text{orig}} > 0 \\ \text{undefined (all-black baseline)}, & \text{if } T_{\text{orig}} = 0 \end{cases}$$

---

## 🧪 Verified Academic Benchmark

The project specification mandates verification against the standard 3×3 matrix:

$$A = \begin{bmatrix} 10 & 20 & 30 \\ 40 & 50 & 60 \\ 70 & 80 & 90 \end{bmatrix}$$

### Manual Analytical Proof:
1. **Row 1 Line Integral:** $R_1 = 10 + 20 + 30 = 60$
2. **Row 2 Line Integral:** $R_2 = 40 + 50 + 60 = 150$
3. **Row 3 Line Integral:** $R_3 = 70 + 80 + 90 = 240$
4. **Total Brightness Integral ($T$):** $T = R_1 + R_2 + R_3 = 60 + 150 + 240 = \mathbf{450}$
5. **Pixel Count ($N$):** $m \times n = 3 \times 3 = \mathbf{9}$
6. **Average Brightness ($\bar{B}$):** $\bar{B} = \frac{450}{9} = \mathbf{50.00}$
7. **Normalized Brightness Percentage:** $\left(\frac{50}{255}\right) \times 100\% = \mathbf{19.6078\% \approx 19.61\%}$
8. **Extrema:** $\min(A) = \mathbf{10}$, $\max(A) = \mathbf{90}$

*This exact benchmark is automatically verified in both backend (`backend/tests/test_backend.py`) and frontend (`frontend/src/utils/mathEngine.test.ts`) test suites.*

---

## 🚀 Setup & Running Instructions

### Windows Setup

#### 1. Backend Setup & Startup (PowerShell or CMD)
```powershell
# Navigate to the backend directory
cd backend

# Create Python virtual environment (if not already created)
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate.ps1
# (In CMD: .\venv\Scripts\activate.bat)

# Install dependencies
pip install -r requirements.txt

# Run backend unit tests
python -m pytest tests

# Start the FastAPI server on port 8000
python -m uvicorn app.main:app --port 8000 --reload
```
The FastAPI interactive documentation will be accessible at:  
👉 `http://127.0.0.1:8000/docs`

---

#### 2. Frontend Setup & Startup (New Terminal Window)
```powershell
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Run frontend tests
npm test

# Build production bundle (verifies TypeScript & styling)
npm run build

# Start the Vite development server
npm run dev
```
Open your browser and navigate to:  
👉 `http://localhost:5173`

---

### macOS / Linux Setup

#### 1. Backend Setup & Startup (Bash / Zsh)
```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend test suite
PYTHONPATH=. pytest tests

# Start FastAPI server
uvicorn app.main:app --port 8000 --reload
```

---

#### 2. Frontend Setup & Startup (New Terminal Window)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run frontend tests
npm test

# Start Vite development server
npm run dev
```

---

## 🔌 API Specification & REST Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health probe reporting service status, version, and NumPy runtime |
| `POST` | `/api/analyze` | Multipart image upload; executes ITU-R BT.601 luminance conversion, evaluates double integration, and saves record to SQLite |
| `POST` | `/api/integrate` | Evaluates localized double integration over a defined sub-domain $[x, y, w, h]$ |
| `POST` | `/api/simulate` | Evaluates affine transformation $I_{\text{new}} = \text{clamp}(c(I - 127.5) + 127.5 + b, 0, 255)$ and recalculates integral deltas |
| `GET` | `/api/history` | Retrieves all stored analysis records from SQLite in reverse chronological order |
| `GET` | `/api/history/{id}` | Retrieves detailed record telemetry including 256-bin histogram |
| `DELETE` | `/api/history/{id}` | Deletes record from SQLite database and clears in-memory cache |
| `POST` | `/api/reports/{id}` | Generates and streams a formal downloadable academic PDF report via ReportLab |

Interactive Swagger documentation: `http://127.0.0.1:8000/docs`

---

## 🧪 Automated Verification Tests

### Backend Test Suite (`backend/tests/test_backend.py`)
Run with:
```powershell
$env:PYTHONPATH='backend'; backend\venv\Scripts\python.exe -m pytest backend\tests
```
**Tests Covered (9 Passed):**
1. `test_health_check_endpoint`: Validates `/api/health` responds with online status and NumPy version.
2. `test_specification_3x3_benchmark_matrix`: Verifies the benchmark matrix ($T=450, \bar{B}=50.00, B_{\text{norm}}\approx 19.61\%$).
3. `test_all_black_image`: Validates boundary handling of pitch-black images ($T=0, \bar{B}=0$).
4. `test_all_white_image`: Validates boundary handling of specular white images ($T=9 \times 255, \bar{B}=255$).
5. `test_transparent_png_compositing`: Verifies transparent alpha pixels blend over pure white reference background.
6. `test_invalid_upload_handling`: Verifies rejection of empty and corrupted binary files.
7. `test_region_integration_roi`: Validates exact double integration over sub-domains.
8. `test_simulator_and_zero_division_safety`: Verifies transformation formula and division-by-zero protection.
9. `test_database_and_report_flow`: Verifies end-to-end SQLite persistence, session caching, and ReportLab PDF binary generation.

---

### Frontend Test Suite (`frontend/src/utils/mathEngine.test.ts`)
Run with:
```powershell
npm --prefix frontend test
```
**Tests Covered (7 Passed):**
1. Verification of the 3×3 benchmark matrix from the project specification.
2. ITU-R BT.601 photopic coefficient verification.
3. All-black image boundary condition.
4. All-white image boundary condition.
5. Transparent PNG alpha compositing over pure white.
6. Zero-original-total division-by-zero safety guard.
7. Rectangular sub-region integration (ROI) accumulation.

---

## 🎓 College Viva Voce Defense Guide

BrightInt includes an interactive viva preparation module with 8 core examiner questions:

1. **How is a digital image formally represented as a mathematical matrix?**  
   *Answer:* A digital image of resolution $m \times n$ is modeled as a matrix $A = [a_{ij}] \in \mathbb{R}^{m \times n}$, where row index $i \in \{1, \dots, m\}$ denotes vertical space and column index $j \in \{1, \dots, n\}$ denotes horizontal space. Each scalar $a_{ij}$ represents the sampled photometric luminance at that coordinate.

2. **What is the fundamental connection between matrix summation and double integration?**  
   *Answer:* Total luminous flux over continuous region $D$ is $\iint_D B(x, y) \, dA$. When partitioned into unit-area pixels ($\Delta A = 1$), this integral is approximated by the 2D Riemann sum $T \approx \sum_i \sum_j B(i, j) \cdot \Delta A$. In matrix algebra, this is $1^T \cdot A \cdot 1$. By the definition of Riemann integration, as $\Delta A \to 0$, the sum converges to the continuous integral.

3. **Why are ITU-R BT.601 weights (0.299, 0.587, 0.114) used instead of an unweighted arithmetic average?**  
   *Answer:* The human photopic visual response is non-uniform across the spectrum, peaking in the green spectrum (~555 nm). Weighting RGB channels with $w = [0.299, 0.587, 0.114]^T$ accurately models perceived luminance. An unweighted average $(R+G+B)/3$ would incorrectly overemphasize blue photons, to which human eyes are least sensitive.

4. **How do linear transformations on matrices relate to brightness adjustments?**  
   *Answer:* Brightness offset corresponds to matrix addition $A_{\text{new}} = A + \Delta b \cdot J$ (where $J$ is a matrix of ones). Contrast adjustment corresponds to scalar multiplication $A_{\text{new}} = c \cdot A$. Together they form an affine mapping clamped to $[0, 255]$.

5. **In the benchmark matrix [[10, 20, 30], [40, 50, 60], [70, 80, 90]], calculate the exact total and average brightness.**  
   *Answer:* Row sums: $R_1 = 60, R_2 = 150, R_3 = 240$. Total $T = 60 + 150 + 240 = 450$. Average $\bar{B} = 450 / 9 = 50.00$. Normalized percentage is $(50 / 255) \times 100\% \approx 19.61\%$.

6. **How does image resolution affect the discrete double integral?**  
   *Answer:* Resolution determines matrix dimensions $m$ and $n$. As resolution increases, pixel count $N = m \cdot n$ grows quadratically. Under unit-area convention ($\Delta A = 1$), the discrete sum $T$ scales proportionally with $N$, while average brightness $\bar{B} = T / N$ remains invariant to sampling density.

7. **What mathematical precaution must be taken when computing percentage change in total brightness?**  
   *Answer:* Percentage change is $\% \Delta = ((T_{\text{new}} - T_{\text{orig}}) / T_{\text{orig}}) \times 100\%$. If an image is pitch black ($T_{\text{orig}} = 0$), this produces an indeterminate division by zero. The application detects $T_{\text{orig}} = 0$ and returns an explicit `null` / undefined state.

8. **What is the Mean Value Theorem for multiple integrals and how is it realized in this project?**  
   *Answer:* The Mean Value Theorem states that for continuous $B(x, y)$ on closed bounded region $D$, there exists $(x_0, y_0) \in D$ such that $\iint_D B(x, y) \, dA = B(x_0, y_0) \cdot \text{Area}(D)$. In digital processing, $\bar{B} = \frac{1}{mn} \sum_i \sum_j B(i, j)$ represents the uniform surface elevation having equivalent integral volume.

---

## 📄 License
Academic Subject Project — Built for College Linear Algebra & Multivariable Calculus demonstrations.
