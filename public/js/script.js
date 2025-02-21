const form = document.getElementById('weatherForm');
const resultDiv = document.getElementById('weatherResult');
const mapContainer = document.getElementById('map');
let map;

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = document.getElementById('cityInput').value;

    try {
        const response = await fetch('/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ city })
        });
        const data = await response.json();
        if (response.ok) {
            resultDiv.innerHTML = `
                <h2>${city}, ${data.country} <img src="https://flagcdn.com/w40/${data.country.toLowerCase()}.png" alt="Flag" style="width: 40px; height: 30px; margin-left: 10px;"></h2>
                <p>${data.description}</p>
                <img src="${data.icon}" alt="Weather icon">
                <p>Temperature: ${data.temperature}°C</p>
                <p>Feels like: ${data.feels_like}°C</p>
                <p>Humidity: ${data.humidity}%</p>
                <p>Pressure: ${data.pressure} hPa</p>
                <p>Wind Speed: ${data.wind_speed} m/s</p>
                <p>Coordinates: [${data.coordinates.lat}, ${data.coordinates.lon}]</p>
                <p>Rain Volume (3h): ${data.rain_volume} mm</p>
            `;

            if (data.news) {
                resultDiv.innerHTML += `
                    <h3>Latest news in ${city}:</h3>
                    <p><a href="${data.news.url}" target="_blank">${data.news.title}</a></p>
                    <p>${data.news.description}</p>
                `;
            }

            if (map) {
                map.destroy();
            }

            ymaps.ready(function () {
                map = new ymaps.Map(mapContainer, {
                    center: [data.cityCoordinates.lat, data.cityCoordinates.lon],
                    zoom: 10
                });

                const placemark = new ymaps.Placemark([data.cityCoordinates.lat, data.cityCoordinates.lon], {
                    hintContent: city
                });

                map.geoObjects.add(placemark);
            });
        } else {
            resultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<p>Failed to fetch data</p>`;
    }
});
