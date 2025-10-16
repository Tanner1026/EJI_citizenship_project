# Quick Start Guide 🚀

## Environmental Justice & Air Quality Dashboard

Your interactive map is ready to visualize EJI hotspots overlaid with air quality data!

### Getting Started in 3 Steps

#### 1. The Server is Already Running! ✅
```
http://localhost:5000
```

#### 2. Open Your Browser
Navigate to **http://localhost:5000** to see the dashboard

#### 3. Explore the Data
- View summary statistics at the top
- Use the map controls to switch between views
- Explore hotspots in the table below the map

## What You'll See

### 📊 Summary Cards
- **928 Counties** analyzed (merged EJI and AQI data)
- **Average EJI** and **Air Quality** metrics
- **11 High-Risk Counties** with both high EJI and poor air quality

### 🗺️ Interactive Map
**Three View Modes:**
1. **Environmental Justice Index** - Shows counties by EJI percentile (higher = greater environmental burden)
2. **Air Quality (Median AQI)** - Shows counties by median air quality
3. **Combined Risk Score** - Combines both metrics for overall risk

**How to Use:**
- Hover over data points to see county details
- Bubble size = population
- Color intensity = selected metric value

### 🔥 Hotspots Table
Automatically identifies counties with:
- EJI > 75th percentile (top 25% environmental justice concerns)
- Median AQI > 45 (approaching/in moderate air quality)

**Example Hotspots Found:**
- **Ottawa County, OK** - EJI 88%, Median AQI 51
- **Union County, AR** - EJI 86%, Median AQI 49
- **Shoshone County, ID** - EJI 86%, Median AQI 46

### 🎛️ Filter Controls

**Min EJI Percentile Slider**
- Filter to show only counties above a certain environmental justice threshold
- 0% = all counties, 75% = only hotspots

**Min Median AQI Slider**
- Filter to show only counties above a certain air quality threshold
- 0 = all counties, 50 = moderate or worse air quality

### 📋 Data Browser
- **Search box** - Type state or county names
- **Sortable columns** - Click any column header to sort
- Shows 100 counties at a time

## Understanding the Data

### EJI (Environmental Justice Index)
The CDC's measure combining:
- Social vulnerability (poverty, housing, demographics)
- Environmental burdens (pollution, hazardous sites)
- Health vulnerabilities (chronic diseases)

**Percentile Interpretation:**
- 0-25%: Low concern
- 25-50%: Moderate-low concern
- 50-75%: Moderate-high concern
- **75-100%: High concern (HOTSPOTS)**

### AQI (Air Quality Index)
EPA's measure of daily air quality:
- **0-50**: Good (Green)
- **51-100**: Moderate (Yellow)
- **101-150**: Unhealthy for Sensitive Groups (Orange)
- **151-200**: Unhealthy (Red)
- **201-300**: Very Unhealthy (Purple)
- **301+**: Hazardous (Maroon)

## Key Insights from Your Data

✅ **928 counties** have both EJI and AQI data available

✅ **11 high-risk counties** identified with:
   - High environmental justice burdens
   - Poor air quality

✅ **Average Median AQI: 39.3** 
   - Overall good air quality across analyzed counties

✅ **72 counties** have high EJI (>75th percentile)

✅ **67 counties** have elevated median AQI (>50)

## Example Explorations

### Find Worst-Case Scenarios
1. Set **Min EJI Percentile** to 75%
2. Set **Min Median AQI** to 50
3. View the filtered map showing only high-risk areas

### Compare by State
1. Use the **Search box** to filter by state name (e.g., "California")
2. Sort the **EJI %ile** column to see which counties have highest burden

### Investigate Specific Counties
1. Hover over data points in the map for details
2. Check the hotspots table for population, demographics
3. See how many "good" vs "moderate" air quality days

## API Endpoints (For Advanced Users)

### Get All Data
```bash
curl http://localhost:5000/api/data
```

### Get Summary Stats
```bash
curl http://localhost:5000/api/summary
```

### Get Hotspots Only
```bash
curl http://localhost:5000/api/hotspots
```

### Get State-Specific Data
```bash
curl http://localhost:5000/api/state/California
```

## Troubleshooting

**Q: Map isn't loading?**
A: Check the browser console (F12) for errors. Ensure Plotly.js loaded correctly.

**Q: No data showing?**
A: Verify both CSV files are in the correct folders:
- `annual_aqi_by_county_2024/annual_aqi_by_county_2024.csv`
- `EJI_2024_United_States_CSV/EJI_2024_United_States.csv`

**Q: Server won't start?**
A: Make sure pandas and numpy are installed:
```bash
pip install pandas numpy
```

**Q: Want to restart the server?**
A: Press `Ctrl+C` in the terminal, then run `python app.py` again

## Next Steps

📌 **Explore different map views** to understand the relationship between EJI and air quality

📌 **Identify priority counties** that need environmental justice interventions

📌 **Export data** by copying from the data table or using the API endpoints

📌 **Share findings** with stakeholders using the interactive visualization

---

**Built with your EJI 2024 and AQI 2024 data! 🌍**
