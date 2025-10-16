# Environmental Justice & Air Quality Dashboard 🌍

An interactive web application that visualizes the relationship between Environmental Justice Index (EJI) data and Air Quality Index (AQI) data across US counties. Identify environmental justice hotspots with poor air quality and explore demographic and health trends.

## Features

- **Interactive County-Level Visualization** - Explore data across all US counties with merged EJI and AQI data
- **Multiple Map Views**:
  - Environmental Justice Index (EJI Percentile)
  - Air Quality (Median AQI)
  - Combined Risk Score
- **Dynamic Filtering** - Filter by minimum EJI percentile and median AQI thresholds
- **Hotspot Identification** - Automatically identifies counties with high EJI (>75th percentile) and poor air quality (Median AQI >45)
- **Comprehensive Data Tables** - Browse and search all county data
- **Real-time Statistics** - Summary cards showing key metrics

## Data Sources

- **Environmental Justice Index (EJI) 2024** - CDC/ATSDR
  - Census tract-level data covering social vulnerability, environmental burden, and health vulnerability
  - Aggregated to county level for this visualization
- **Air Quality Index (AQI) 2024** - EPA
  - Annual air quality data by county
  - Includes median, max, 90th percentile AQI values
  - Days categorized by AQI level (Good, Moderate, Unhealthy, etc.)

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Setup Instructions

1. **Ensure your data files are in place**:
   ```
   citizenship_prjct/
   ├── annual_aqi_by_county_2024/
   │   └── annual_aqi_by_county_2024.csv
   └── EJI_2024_United_States_CSV/
       ├── EJI_2024_United_States.csv
       └── EJI_DATADICTIONARY_2024.csv
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost:5000
   ```

## How to Use

### Dashboard Overview

1. **Summary Cards** - View high-level statistics:
   - Total counties analyzed
   - Average EJI percentile
   - Average median AQI
   - High-risk counties (high EJI + poor air quality)

2. **Map Controls**:
   - **Map View Selector**: Choose between EJI, AQI, or Combined Risk visualization
   - **Min EJI Percentile Slider**: Filter to show only counties above a certain EJI threshold
   - **Min Median AQI Slider**: Filter to show only counties above a certain air quality threshold

3. **Interactive Map**: 
   - Hover over points to see detailed county information
   - Bubble size represents population
   - Color intensity represents the selected metric

4. **Hotspots Table**: 
   - Automatically shows counties with both high environmental justice concerns and poor air quality
   - Sorted by EJI percentile (highest first)

5. **Data Browser**:
   - Search by state or county name
   - Sort by any column (click column headers)
   - View detailed metrics for each county

## Understanding the Data

### Environmental Justice Index (EJI)

The EJI combines three modules:
1. **Social Vulnerability Module (SVM)** - Demographics, socioeconomic status, housing
2. **Environmental Burden Module (EBM)** - Air quality, hazardous sites, built environment
3. **Health Vulnerability Module (HVM)** - Chronic diseases, disabilities

**EJI Percentile (RPL_EJI)**: 
- 0-25%: Low environmental justice concern
- 25-50%: Moderate-low concern
- 50-75%: Moderate-high concern  
- 75-100%: High environmental justice concern (hotspots)

### Air Quality Index (AQI)

**AQI Categories**:
- **0-50** (Good): Air quality is satisfactory
- **51-100** (Moderate): Acceptable, some pollutants may be a concern
- **101-150** (Unhealthy for Sensitive Groups): Sensitive groups may experience health effects
- **151-200** (Unhealthy): Everyone may begin to experience health effects
- **201-300** (Very Unhealthy): Health alert
- **301+** (Hazardous): Health warning of emergency conditions

### High-Risk Counties

Counties identified as "high-risk" meet both criteria:
- EJI percentile > 75% (top quartile of environmental justice concerns)
- Median AQI > 45 (approaching or in moderate air quality range)

These counties deserve priority attention for environmental justice interventions.

## API Endpoints

### `GET /`
Serves the main dashboard

### `GET /api/data`
Returns all merged EJI and AQI data for all counties

**Response**:
```json
{
  "success": true,
  "count": 997,
  "data": [...]
}
```

### `GET /api/summary`
Returns summary statistics

**Response**:
```json
{
  "total_counties": 997,
  "avg_eji": 0.512,
  "avg_median_aqi": 42.3,
  "high_eji_counties": 249,
  "poor_air_quality_counties": 112,
  "high_risk_counties": 34
}
```

### `GET /api/hotspots`
Returns counties with high EJI and poor air quality

**Response**:
```json
{
  "success": true,
  "count": 34,
  "hotspots": [...]
}
```

### `GET /api/state/<state_name>`
Returns data for a specific state

**Example**: `/api/state/California`

## Project Structure

```
citizenship_prjct/
├── app.py                              # Flask backend with data processing
├── requirements.txt                    # Python dependencies
├── README.md                          # This file
├── annual_aqi_by_county_2024/         # Air quality data
│   └── annual_aqi_by_county_2024.csv
├── EJI_2024_United_States_CSV/        # Environmental justice data
│   ├── EJI_2024_United_States.csv
│   └── EJI_DATADICTIONARY_2024.csv
├── templates/
│   └── index.html                     # Main dashboard HTML
└── static/
    ├── styles.css                     # Dashboard styling
    └── script.js                      # Interactive functionality
```

## Key Insights

This dashboard helps answer questions like:

- **Where are environmental justice hotspots located?**
- **Which counties have both high environmental burden and poor air quality?**
- **How does air quality correlate with social vulnerability?**
- **Which communities face disproportionate environmental health risks?**

## Technical Details

### Data Processing

1. **EJI Aggregation**: Census tract data is aggregated to county level by:
   - Summing population counts
   - Averaging percentile scores
   - Calculating weighted demographic percentages

2. **Data Merging**: EJI and AQI datasets are merged on:
   - State name (standardized)
   - County name (standardized, "County" suffix removed)

3. **Risk Scoring**: Combined risk score calculated as:
   ```
   Combined Risk = (EJI_Percentile + Normalized_AQI) / 2
   ```

### Visualization

- **Plotly.js** for interactive charts
- Color scales:
  - EJI: Yellow-Orange-Red (YlOrRd)
  - AQI: Blues
  - Combined: Reds

## Future Enhancements

Potential improvements:
- [ ] True choropleth map with county boundaries
- [ ] Time series analysis (historical trends)
- [ ] Download data as CSV/Excel
- [ ] State-level drill-down views
- [ ] Additional demographic overlays
- [ ] Health outcome correlations
- [ ] Mobile app version

## Data Notes

- Only counties present in both datasets are included in the merged view
- Missing values are handled as `None` and excluded from calculations
- EJI values of -999 indicate missing data in the original dataset

## License

This project is for educational and research purposes. Data sources are publicly available from CDC and EPA.

## Acknowledgments

- **CDC/ATSDR** for the Environmental Justice Index
- **EPA** for Air Quality data
- Built with Flask, Pandas, and Plotly

---

**For questions or issues, please review the data dictionaries included in the EJI dataset.**
