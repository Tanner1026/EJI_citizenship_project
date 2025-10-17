let allData = []; 
let ejiData = []; 
let filteredData = [];
let hotspotsData = [];
let searchFilteredData = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 100;

document.addEventListener('DOMContentLoaded', async function() {
    loadSummary();
    loadHotspots();
    await loadEJIData();
    await loadData();
});

async function loadSummary() {
    try {
        const response = await fetch('/api/summary');
        const data = await response.json();
        
        document.getElementById('totalCounties').textContent = data.total_counties.toLocaleString();
        document.getElementById('avgEJI').textContent = (data.avg_eji * 100).toFixed(1) + '%';
        document.getElementById('avgAQI').textContent = data.avg_median_aqi.toFixed(0);
        document.getElementById('highRisk').textContent = data.high_risk_counties.toLocaleString();
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

async function loadData() {
    try {
        const response = await fetch('/api/data');
        const result = await response.json();
        
        allData = result.data;
        filteredData = allData;
        
        await updateVisualization();
        displayDataTable(allData, currentPage);
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('map').innerHTML = '<p class="error">Error loading map data</p>';
    }
}

async function loadEJIData() {
    try {
        console.log('Loading EJI data...');
        const response = await fetch('/api/eji_data');
        const result = await response.json();
        
        ejiData = result.data;
        console.log(`Loaded ${ejiData.length} counties with EJI data`);
        return ejiData;
    } catch (error) {
        console.error('Error loading EJI data:', error);
        ejiData = [];
        return [];
    }
}

async function loadHotspots() {
    try {
        const response = await fetch('/api/hotspots');
        const result = await response.json();
        
        hotspotsData = result.hotspots;
        displayHotspots(hotspotsData);
    } catch (error) {
        console.error('Error loading hotspots:', error);
    }
}

async function updateVisualization() {
    const mapType = document.getElementById('mapType').value;
    
    let dataToUse, values, colorscale, title, legendDesc;
    
    switch(mapType) {
        case 'eji':
            dataToUse = ejiData.filter(d => {
                const ejiFilter = document.getElementById('filterEJI').value / 100;
                return d.RPL_EJI >= ejiFilter;
            });
            values = dataToUse.map(d => parseFloat((d.RPL_EJI * 100).toFixed(1)));
            colorscale = [
                [0, 'rgb(255, 255, 204)'], 
                [0.25, 'rgb(255, 237, 160)'], 
                [0.5, 'rgb(254, 217, 118)'], 
                [0.75, 'rgb(253, 141, 60)'], 
                [1, 'rgb(227, 26, 28)']        
            ];
            title = 'Environmental Justice Index (Percentile)';
            legendDesc = 'Red = Higher environmental justice concerns (worse). Yellow = Lower concerns (better). Showing ALL counties with EJI data.';
            break;
        case 'aqi':
            dataToUse = filteredData;
            values = dataToUse.map(d => parseFloat(d['Median AQI']));
            colorscale = [
                [0, 'rgb(144, 238, 144)'],      // 0 AQI - Light Green (Good)
                [0.25, 'rgb(255, 255, 153)'],   // ~25 AQI - Light Yellow (Good)
                [0.5, 'rgb(255, 204, 102)'],    // ~50 AQI - Light Orange (Moderate)
                [0.75, 'rgb(255, 128, 0)'],     // ~75 AQI - Orange (Moderate-Unhealthy)
                [1, 'rgb(204, 0, 0)']           // 100+ AQI - Dark Red (Unhealthy)
            ];
            title = 'Air Quality Index (Median AQI)';
            legendDesc = 'Red = Worse air quality (higher AQI). Green = Better air quality (lower AQI). Only showing counties with AQI monitoring stations.';
            break;
        case 'combined':
            dataToUse = filteredData;
            values = dataToUse.map(d => {
                const ejiNorm = d.RPL_EJI * 100;
                const aqiNorm = Math.min(d['Median AQI'], 100);
                return parseFloat(((ejiNorm + aqiNorm) / 2).toFixed(1));
            });
            colorscale = 'Reds';
            title = 'Combined Risk Score';
            legendDesc = 'Combined environmental justice and air quality risk. Only showing counties with both datasets.';
            break;
    }
    
    document.getElementById('legendDesc').textContent = legendDesc;
    
    await createScatterMap(dataToUse, values, colorscale, title, mapType);
}

async function createScatterMap(data, values, colorscale, title, mapType) {
    const hoverText = data.map((d, i) => {
        let text = `<b>${d.COUNTY}, ${d.StateDesc}</b><br>` +
            `Population: ${d.E_TOTPOP?.toLocaleString() || 'N/A'}<br>`;
        
        if (d.RPL_EJI !== null && d.RPL_EJI !== undefined) {
            text += `EJI Percentile: ${(d.RPL_EJI * 100).toFixed(1)}%<br>`;
        }
        
        if (d['Median AQI'] !== null && d['Median AQI'] !== undefined) {
            const totalDays = d['Days with AQI'] || 365;  // Default to 365 if N/A
            text += `Median AQI: ${d['Median AQI']}<br>` +
                `Good Days: ${d['Good Days']} / ${totalDays}<br>`;
        } else if (mapType === 'aqi') {
            text += `<i>No AQI data available</i><br>`;
        }
        
        if (d.PCT_MINRTY !== null && d.PCT_MINRTY !== undefined) {
            text += `% Minority: ${d.PCT_MINRTY.toFixed(1)}%<br>`;
        }
        if (d.PCT_POV200 !== null && d.PCT_POV200 !== undefined) {
            text += `% Below 200% Poverty: ${d.PCT_POV200.toFixed(1)}%`;
        }
        
        return text;
    });
    
    const fips = data.map(d => d.FIPS);
    
    try {
        const response = await fetch('https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json');
        const geojson = await response.json();
        

        const trace = {
            type: 'choropleth',
            geojson: geojson,
            locations: fips,
            z: values,
            text: hoverText,
            hoverinfo: 'text',
            colorscale: colorscale,
            colorbar: {
                title: {
                    text: title,
                    side: 'right'
                },
                thickness: 20,
                len: 0.7
            },
            marker: {
                line: {
                    color: 'white',
                    width: 0.5
                }
            }
        };
        
        const layout = {
            title: {
                text: title + ' - US Counties',
                font: { size: 20, color: '#1f2937' }
            },
            geo: {
                scope: 'usa',
                projection: {
                    type: 'albers usa'
                },
                showlakes: true,
                lakecolor: 'rgb(255, 255, 255)'
            },
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            margin: { t: 60, r: 0, b: 0, l: 0 },
            height: 600
        };
        
        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d']
        };
        
        Plotly.newPlot('map', [trace], layout, config);
    } catch (error) {
        console.error('Error loading map:', error);
        document.getElementById('map').innerHTML = 
            '<div style="padding: 40px; text-align: center; color: #ef4444;">' +
            '<h3>Error Loading Map</h3>' +
            '<p>Could not load county boundaries. Please check your internet connection.</p>' +
            '<p style="font-size: 0.9em; color: #6b7280;">Data is still available in the tables below.</p>' +
            '</div>';
    }
}

async function updateFilters() {
    const ejiFilter = document.getElementById('filterEJI').value / 100;
    const aqiFilter = document.getElementById('filterAQI').value;
    
    document.getElementById('ejiValue').textContent = Math.round(ejiFilter * 100);
    document.getElementById('aqiValue').textContent = aqiFilter;
    
    filteredData = allData.filter(d => 
        d.RPL_EJI >= ejiFilter && d['Median AQI'] >= aqiFilter
    );
    
    currentPage = 1; 
    await updateVisualization();
    displayDataTable(filteredData, currentPage);
}

function displayHotspots(hotspots) {
    const container = document.getElementById('hotspotsTable');
    
    if (hotspots.length === 0) {
        container.innerHTML = '<p>No hotspots found matching criteria</p>';
        return;
    }
    
    let html = '<table><thead><tr>' +
        '<th>County</th>' +
        '<th>State</th>' +
        '<th>Population</th>' +
        '<th>EJI %ile</th>' +
        '<th>Median AQI</th>' +
        '<th>Good Days</th>' +
        '<th>% Minority</th>' +
        '</tr></thead><tbody>';
    
    hotspots.slice(0, 20).forEach(d => {
        const ejiClass = d.RPL_EJI > 0.9 ? 'critical' : 'high';
        const aqiClass = d['Median AQI'] > 60 ? 'poor' : 'moderate';
        
        html += '<tr>' +
            `<td><strong>${d.COUNTY}</strong></td>` +
            `<td>${d.StateDesc}</td>` +
            `<td>${d.E_TOTPOP?.toLocaleString() || 'N/A'}</td>` +
            `<td class="${ejiClass}">${(d.RPL_EJI * 100).toFixed(1)}%</td>` +
            `<td class="${aqiClass}">${d['Median AQI']}</td>` +
            `<td>${d['Good Days']} / ${d['Days with AQI'] || 365}</td>` +
            `<td>${d.PCT_MINRTY?.toFixed(1) || 'N/A'}%</td>` +
            '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function displayDataTable(data, page = 1) {
    const container = document.getElementById('dataTable');
    
    if (data.length === 0) {
        container.innerHTML = '<p>No data matches current filters</p>';
        return;
    }
    
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIdx = (page - 1) * ITEMS_PER_PAGE;
    const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, data.length);
    
    let html = '<table id="mainTable"><thead><tr>' +
        '<th onclick="sortTable(0)">County ↕</th>' +
        '<th onclick="sortTable(1)">State ↕</th>' +
        '<th onclick="sortTable(2)">EJI %ile ↕</th>' +
        '<th onclick="sortTable(3)">Median AQI ↕</th>' +
        '<th onclick="sortTable(4)">Max AQI ↕</th>' +
        '<th onclick="sortTable(5)">Good Days ↕</th>' +
        '</tr></thead><tbody>';
    
    data.slice(startIdx, endIdx).forEach(d => {
        html += '<tr>' +
            `<td>${d.COUNTY}</td>` +
            `<td>${d.StateDesc}</td>` +
            `<td>${(d.RPL_EJI * 100).toFixed(1)}%</td>` +
            `<td>${d['Median AQI']}</td>` +
            `<td>${d['Max AQI']}</td>` +
            `<td>${d['Good Days']}</td>` +
            '</tr>';
    });
    
    html += '</tbody></table>';
    
    html += `<div class="pagination-container">`;
    html += `<p class="table-note">Showing ${startIdx + 1}-${endIdx} of ${data.length} counties</p>`;
    
    if (totalPages > 1) {
        html += '<div class="pagination">';
        
        if (page > 1) {
            html += `<button onclick="changePage(${page - 1})" class="page-btn">← Previous</button>`;
        }
        
        const maxPageButtons = 5;
        let startPage = Math.max(1, page - 2);
        let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
        
        if (endPage - startPage < maxPageButtons - 1) {
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }
        
        if (startPage > 1) {
            html += `<button onclick="changePage(1)" class="page-btn">1</button>`;
            if (startPage > 2) {
                html += `<span class="page-ellipsis">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === page ? 'active' : '';
            html += `<button onclick="changePage(${i})" class="page-btn ${activeClass}">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="page-ellipsis">...</span>`;
            }
            html += `<button onclick="changePage(${totalPages})" class="page-btn">${totalPages}</button>`;
        }
        
        if (page < totalPages) {
            html += `<button onclick="changePage(${page + 1})" class="page-btn">Next →</button>`;
        }
        
        html += '</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function filterTable() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    
    currentPage = 1; 
    
    if (searchTerm === '') {
        searchFilteredData = filteredData;
        displayDataTable(filteredData, currentPage);
        return;
    }
    
    searchFilteredData = filteredData.filter(d =>
        d.COUNTY.toLowerCase().includes(searchTerm) ||
        d.StateDesc.toLowerCase().includes(searchTerm)
    );
    
    displayDataTable(searchFilteredData, currentPage);
}

function changePage(newPage) {
    currentPage = newPage;
    const dataToShow = searchFilteredData.length > 0 || document.getElementById('searchBox').value ? searchFilteredData : filteredData;
    displayDataTable(dataToShow, currentPage);
    
    document.getElementById('dataTable').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

let sortDirection = {};

function sortTable(columnIndex) {
    const table = document.getElementById('mainTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    sortDirection[columnIndex] = !sortDirection[columnIndex];
    const ascending = sortDirection[columnIndex];
    
    rows.sort((a, b) => {
        let aVal = a.cells[columnIndex].textContent;
        let bVal = b.cells[columnIndex].textContent;
        
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return ascending ? aNum - bNum : bNum - aNum;
        }
        
        return ascending ? 
            aVal.localeCompare(bVal) : 
            bVal.localeCompare(aVal);
    });
    
    rows.forEach(row => tbody.appendChild(row));
}
