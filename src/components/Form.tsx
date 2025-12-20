// Form.tsx

import {useState} from "react"

// https://api.weatherapi.com/v1/current.json?key=a06640e103a1492a91585210252609&q=London&aqi=no

const Form = (props) => {
    return (
        <form>
            <input type="text"
                name="city"
                placeholder="都市名"
                onChange={e=>setCity(e.target.value)}
            />

            <button type="submit"
                onClick={getWeather}
            >
                Get Weather
            </button>
        </form>
    )
}

export default Form