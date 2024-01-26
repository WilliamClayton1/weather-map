"use strict"
import {MAPBOX_API_TOKEN, WEATHER_API_TOKEN} from "./keys.js";
import {reverseGeocode} from "./mapbox-geocoder-utils.js";

name = `Converse, TX`
let CURRENT_FORECAST_URL = `https://api.openweathermap.org/data/2.5/forecast?q=${name},US&appid=${WEATHER_API_TOKEN}&units=imperial`;

function cloudCoverage(sky) {
    //weather icons
    let sunny = "https://openweathermap.org/img/wn/01d.png";
    let fewClouds = "https://openweathermap.org/img/wn/02d.png";
    let scattered = "https://openweathermap.org/img/wn/03d.png";
    let broken = "https://openweathermap.org/img/wn/04d.png";
    let rain = "https://openweathermap.org/img/wn/09d.png";
    let shower = "https://openweathermap.org/img/wn/10d.png";
    let thunderstorm = "https://openweathermap.org/img/wn/11d.png";
    let snow = "https://openweathermap.org/img/wn/13d.png";
    let mist = "https://openweathermap.org/img/wn/50d.png";

    //displays icon based on weather cloud coverage
    switch (sky) {
        case 'clear sky':
            return sunny
        case 'few clouds':
            return fewClouds
        case 'broken clouds' || 'scattered clouds':
            return scattered
        case 'overcast clouds':
            return broken
        case 'light rain' || 'shower rain':
            return shower
        case 'moderate rain' || 'rain' :
            return rain
        case 'thunderstorm':
            return thunderstorm
        case 'snow':
            return snow
        case 'mist':
            return mist
    }
}

$.get(CURRENT_FORECAST_URL).done((data) => {

    let forecastData = data.list;
    let html = "";

    //function to gather, loop, and display data
    function weatherData(forecast) {

        for (let i = 0; i < forecast.length; i += 8) {

            //date conversion
            let date = new Date(forecast[i].dt_txt);
            let year = date.getFullYear();
            let month = ((date.getMonth() + 1).length !== 2 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1));
            let day = date.getDate();
            let newDate = `${month}-${day}-${year}`

            //weather data variables
            let highTemp = forecast[i].main.temp_max
            let lowTemp = forecast[i].main.temp_min
            let coverage = forecast[i].weather[0].description
            let humidity = forecast[i].main.humidity
            let windSpeed = forecast[i].wind.speed
            let pressure = forecast[i].main.pressure

            //code populates weather data into HTML
            html += `<div class="card bg-primary bg-gradient" style="width: 18rem;">`;
            html += `<p id="date" class="card-header text-center">${newDate}</p>`;
            html += `<div>`;
            html += `<p class="card-text text-center m-0"><ins>Temperature</ins></p>`;
            html += `<div id="temp" class="card-text text-center"><p class="m-0"><strong>${lowTemp}&deg; / ${highTemp}&deg;</strong></p><img src='${cloudCoverage(coverage)}' alt='${coverage}'></div>`;
            html += `</div>`;
            html += `<ul class="list-group list-group-flush">`
            html += `<li class="list-group-item">Desription: <strong>${coverage}</strong></li>`;
            html += `<li class="list-group-item">Humidity: <strong>${humidity}%</strong></li>`;
            html += `<li class="list-group-item">Wind: <strong>${windSpeed} mph</strong></li>`;
            html += `<li class="list-group-item">Pressure: <strong>${pressure}</strong></li>`;
            html += `</ul>`
            html += `</div>`;

            $("#insert-weather").html(html);
        }
    }

    //displays city name on html
    function userLocation(cityAndState) {
        $("#currentCity").html(`${cityAndState}`)
        $(".mapboxgl-ctrl-geocoder--input").attr("value", cityAndState)
    }

    //location stored in variables
    let location = `${data.city.coord.lon},${data.city.coord.lat}`;
    let lonLat = location.split(',')

    //mapbox map
    mapboxgl.accessToken = MAPBOX_API_TOKEN;
    const map = new mapboxgl.Map({
        container: 'insert-map', // container ID
        style: 'mapbox://styles/mapbox/streets-v12',
        center: lonLat, // starting position [lng, lat]
        zoom: 13, // starting zoom
    });

    let marker = new mapboxgl.Marker({draggable: true, color: 'blue'});

    //add zoom feature
    map.addControl(new mapboxgl.NavigationControl({
        container: 'body'
    }), 'bottom-right');

    //add fullscreen option
    map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');


    //geocoder search
    let geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        marker: false,
        mapboxgl: mapboxgl
    })

    //add marker based on user search
    map.addControl(
        geocoder.on('result', function (result) {

            marker.setLngLat(result.result.center)
            marker.addTo(map)
            let lngLat = marker.getLngLat()

            map.flyTo({
                center: lngLat,
                zoom: 13,
                essential: true,
            })

            //weather data based on user input
            let USER_INPUT = `https://api.openweathermap.org/data/2.5/forecast?lat=${lngLat.lat}&lon=${lngLat.lng}&appid=${WEATHER_API_TOKEN}&units=imperial`;
            $.get(USER_INPUT).done((data) => {
                let newData = data.list
                html = "";
                let address = `${data.city.name}, ${data.city.country}`
                $("#currentCity").html(`${address}`)
                weatherData(newData)
            })

            function dragEnd() {

                lngLat = marker.getLngLat()
                reverseGeocode(lngLat, MAPBOX_API_TOKEN).then(function (results) {
                    $('input[type=text].mapboxgl-ctrl-geocoder--input').val(results)
                })
                map.flyTo({
                    center: lngLat,
                    zoom: 13,
                    essential: true,
                })

                //weather data based on marker placement
                let CURRENT_FORECAST = `https://api.openweathermap.org/data/2.5/forecast?lat=${lngLat.lat}&lon=${lngLat.lng}&appid=${WEATHER_API_TOKEN}&units=imperial`

                $.get(CURRENT_FORECAST).done((data) => {
                    let newData = data.list
                    html = "";
                    let newName = `${data.city.name}, ${data.city.country}`
                    $("#currentCity").html(`${newName}`)
                    weatherData(newData)
                })

            }

            marker.on('dragend', dragEnd);
        }), 'bottom-left')

    //populates weather for current city
    marker.setLngLat(lonLat);
    marker.addTo(map);

    //second drag function
    function drag() {
        let lngLat = marker.getLngLat()
        reverseGeocode(lngLat, MAPBOX_API_TOKEN).then(function (newData) {
            $('input[type=text].mapboxgl-ctrl-geocoder--input').val(newData)
        })
        map.flyTo({
            center: lngLat,
            zoom: 13,
            essential: true,
        })

        //weather data based on marker placement
        CURRENT_FORECAST_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lngLat.lat}&lon=${lngLat.lng}&appid=${WEATHER_API_TOKEN}&units=imperial`

        $.get(CURRENT_FORECAST_URL).done((data) => {
            let newData = data.list
            html = "";
            let newName = `${data.city.name}, ${data.city.country}`
            $("#currentCity").html(`${newName}`)
            weatherData(newData)
        })
    }

    marker.on('dragend', drag)
    weatherData(forecastData);
    userLocation(name);
})
