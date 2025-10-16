from flask import Flask, render_template, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import json

app = Flask(__name__)
CORS(app)

print("Loading datasets...")

aqi_df = pd.read_csv('annual_aqi_by_county_2024/annual_aqi_by_county_2024.csv')
print(f"Loaded {len(aqi_df)} counties with AQI data")


eji_df = pd.read_csv('EJI_2024_United_States_CSV/EJI_2024_United_States.csv')
print(f"Loaded {len(eji_df)} census tracts with EJI data")

def aggregate_eji_by_county():
    """Aggregate EJI data from census tract level to county level"""
    eji_df['COUNTY_CLEAN'] = eji_df['COUNTY'].str.replace(' County', '').str.strip()
    
    eji_clean = eji_df.replace(-999, np.nan)
    
    county_eji = eji_clean.groupby(['StateDesc', 'COUNTY_CLEAN']).agg({
        'E_TOTPOP': 'sum', 
        'SPL_EJI': 'mean',  
        'RPL_EJI': 'mean',  
        'SPL_SVM': 'mean',  
        'SPL_EBM': 'mean',  
        'E_MINRTY': 'mean',  
        'E_POV200': 'mean',  
        'E_ASTHMA': 'mean',  
        'E_CANCER': 'mean',  
    }).reset_index()
    
    county_eji['PCT_MINRTY'] = county_eji['E_MINRTY'].round(1)
    county_eji['PCT_POV200'] = county_eji['E_POV200'].round(1)
    
    county_eji['PCT_MINRTY'] = county_eji['PCT_MINRTY'].fillna(0)
    county_eji['PCT_POV200'] = county_eji['PCT_POV200'].fillna(0)
    
    return county_eji

def get_state_fips():
    """Return mapping of state names to FIPS codes"""
    return {
        'Alabama': '01', 'Alaska': '02', 'Arizona': '04', 'Arkansas': '05',
        'California': '06', 'Colorado': '08', 'Connecticut': '09', 'Delaware': '10',
        'District of Columbia': '11', 'Florida': '12', 'Georgia': '13', 'Hawaii': '15',
        'Idaho': '16', 'Illinois': '17', 'Indiana': '18', 'Iowa': '19',
        'Kansas': '20', 'Kentucky': '21', 'Louisiana': '22', 'Maine': '23',
        'Maryland': '24', 'Massachusetts': '25', 'Michigan': '26', 'Minnesota': '27',
        'Mississippi': '28', 'Missouri': '29', 'Montana': '30', 'Nebraska': '31',
        'Nevada': '32', 'New Hampshire': '33', 'New Jersey': '34', 'New Mexico': '35',
        'New York': '36', 'North Carolina': '37', 'North Dakota': '38', 'Ohio': '39',
        'Oklahoma': '40', 'Oregon': '41', 'Pennsylvania': '42', 'Rhode Island': '44',
        'South Carolina': '45', 'South Dakota': '46', 'Tennessee': '47', 'Texas': '48',
        'Utah': '49', 'Vermont': '50', 'Virginia': '51', 'Washington': '53',
        'West Virginia': '54', 'Wisconsin': '55', 'Wyoming': '56'
    }

def merge_datasets():
    """Merge EJI and AQI data by county"""
    county_eji = aggregate_eji_by_county()
    county_eji = county_eji.reset_index()
    
    aqi_df['County'] = aqi_df['County'].str.strip()
    
    merged = pd.merge(
        county_eji,
        aqi_df,
        left_on=['StateDesc', 'COUNTY_CLEAN'],
        right_on=['State', 'County'],
        how='inner'
    )
    
    merged['COUNTY'] = merged['COUNTY_CLEAN']
    
    state_fips = get_state_fips()
    merged['STATE_FIPS'] = merged['StateDesc'].map(state_fips)
    
    eji_df['COUNTY_CLEAN'] = eji_df['COUNTY'].str.replace(' County', '').str.strip()
    county_fips_map = eji_df.groupby(['StateDesc', 'COUNTY_CLEAN'])['COUNTYFP'].first().to_dict()
    merged['COUNTY_FIPS'] = merged.apply(
        lambda row: county_fips_map.get((row['StateDesc'], row['COUNTY']), '000'),
        axis=1
    )
    
    merged['FIPS'] = merged['STATE_FIPS'] + merged['COUNTY_FIPS'].astype(str).str.zfill(3)
    
    print(f"Merged dataset contains {len(merged)} counties")
    return merged

merged_data = merge_datasets()

eji_only_data = aggregate_eji_by_county()
state_fips = get_state_fips()
eji_only_data['STATE_FIPS'] = eji_only_data['StateDesc'].map(state_fips)

eji_df['COUNTY_CLEAN'] = eji_df['COUNTY'].str.replace(' County', '').str.strip()
county_fips_map = eji_df.groupby(['StateDesc', 'COUNTY_CLEAN'])['COUNTYFP'].first().to_dict()
eji_only_data['COUNTY_FIPS'] = eji_only_data.apply(
    lambda row: county_fips_map.get((row['StateDesc'], row['COUNTY_CLEAN']), '000'),
    axis=1
)
eji_only_data['FIPS'] = eji_only_data['STATE_FIPS'] + eji_only_data['COUNTY_FIPS'].astype(str).str.zfill(3)
eji_only_data['COUNTY'] = eji_only_data['COUNTY_CLEAN']

print(f"EJI-only dataset contains {len(eji_only_data)} counties")

@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    """Get all merged data for visualization"""
    data = merged_data.copy()
    
    data = data.replace({np.nan: None, -999: None})
    
    columns = [
        'StateDesc', 'COUNTY', 'E_TOTPOP', 'FIPS',
        'SPL_EJI', 'RPL_EJI', 'SPL_SVM', 'SPL_EBM',
        'PCT_MINRTY', 'PCT_POV200',
        'Median AQI', 'Max AQI', '90th Percentile AQI',
        'Good Days', 'Moderate Days', 'Unhealthy for Sensitive Groups Days',
        'Unhealthy Days', 'Days with AQI'
    ]
    
    data_subset = data[columns].to_dict(orient='records')
    
    return jsonify({
        'success': True,
        'count': len(data_subset),
        'data': data_subset
    })

@app.route('/api/eji_data')
def get_eji_data():
    """Get EJI-only data (all counties with EJI, regardless of AQI)"""
    data = eji_only_data.copy()
    
    data = data.replace({np.nan: None, -999: None})
    
    columns = [
        'StateDesc', 'COUNTY', 'E_TOTPOP', 'FIPS',
        'SPL_EJI', 'RPL_EJI', 'SPL_SVM', 'SPL_EBM',
        'PCT_MINRTY', 'PCT_POV200'
    ]
    
    data_subset = data[columns].to_dict(orient='records')
    
    return jsonify({
        'success': True,
        'count': len(data_subset),
        'data': data_subset
    })

@app.route('/api/summary')
def get_summary():
    """Get summary statistics"""
    valid_eji = merged_data[
        (merged_data['RPL_EJI'] >= 0) & 
        (merged_data['RPL_EJI'] <= 1)
    ]
    
    summary = {
        'total_counties': len(merged_data),
        'avg_eji': float(valid_eji['RPL_EJI'].mean().round(3)),
        'avg_median_aqi': float(merged_data['Median AQI'].mean().round(1)),
        'high_eji_counties': len(valid_eji[valid_eji['RPL_EJI'] > 0.75]),
        'poor_air_quality_counties': len(merged_data[merged_data['Median AQI'] > 50]),
        'high_risk_counties': len(merged_data[
            (merged_data['RPL_EJI'] > 0.75) & 
            (merged_data['Median AQI'] > 50)
        ])
    }
    return jsonify(summary)

@app.route('/api/hotspots')
def get_hotspots():
    """Get EJI hotspots with poor air quality"""
    hotspots = merged_data[
        (merged_data['RPL_EJI'] > 0.75) & 
        (merged_data['Median AQI'] > 45)
    ].copy()
    
    hotspots = hotspots.sort_values('RPL_EJI', ascending=False)
    columns = [
        'StateDesc', 'COUNTY', 'E_TOTPOP', 'RPL_EJI', 'SPL_EJI',
        'Median AQI', 'Max AQI', 'Good Days', 'Moderate Days',
        'Unhealthy for Sensitive Groups Days', 'PCT_MINRTY', 'PCT_POV200'
    ]
    
    hotspots_data = hotspots[columns].replace({np.nan: None, -999: None})
    
    return jsonify({
        'success': True,
        'count': len(hotspots_data),
        'hotspots': hotspots_data.to_dict(orient='records')
    })

@app.route('/api/state/<state_name>')
def get_state_data(state_name):
    """Get data for a specific state"""
    state_data = merged_data[merged_data['StateDesc'] == state_name].copy()
    state_data = state_data.replace({np.nan: None, -999: None})
    
    return jsonify({
        'success': True,
        'state': state_name,
        'counties': state_data.to_dict(orient='records')
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
