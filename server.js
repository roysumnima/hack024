//Code adapted from https://github.com/alnacle/spotify-api-workshop
/* Requires installation of Node.js, JavaScript and npmIntelliSense. First, run "npm install". Secondly, run "npm start run" */

import express from "express";
import fetch from "node-fetch";

import axios from 'axios';

const app = express();

app.set("views", "./views");
app.set("view engine", "pug");

app.use(express.static("public"));

const redirect_uri = "http://localhost:3000/callback";
const client_id = "b8a21c775bab494aa9d795b641ed6e0d";
const client_secret = "7dbd4e2520404905b602ccc3f19bc755";

global.access_token;

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/authorize", (req, res) => {
  var auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: client_id,
    scope: "user-library-read",
    redirect_uri: redirect_uri,
  });

  res.redirect(
    "https://accounts.spotify.com/authorize?" + auth_query_parameters.toString()
  );
});

/*
app.get("/callback", (req, res) => {
  const code = req.query.code;
  console.log(code);

});

app.get("/authorize", (req, res) => {
  console.log("hello");
});*/


app.get("/callback", async (req, res) => {
  const code = req.query.code;

  var body = new URLSearchParams({
    code: code,
    redirect_uri: redirect_uri,
    grant_type: "authorization_code"
  })

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "post",
    body: body,
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64")
    }
  })

  const data = await response.json();
  global.access_token = data.access_token;
  
  res.redirect("/dashboard");
 
});


async function getSongData(endpoint) {
  const response = await fetch("https://api.spotify.com/v1" + endpoint, {
    method: "get",
    headers: {
      Authorization: "Bearer " + global.access_token,
    },
  });

  const data = await response.json();
  return data;
}


const weatherKey = "CMF43DPEY8R3TXLE8KTAA5KUL";
  async function getWeatherData() {
  try {
    // Get city data
    const ipInfoResponse = await axios.get('https://ipinfo.io/');
    const citydata = ipInfoResponse.data.city;

    // Get weather data
    const url = `https://wttr.in/${citydata}?format=%C+%t`;
    const weatherResponse = await axios.get(url);
    const summary = weatherResponse.data;
    const lines = summary.split(" ");
    const temperature = lines.pop();
    const weatherType = lines.join(" ");

    return [weatherType, temperature, citydata];
  } catch (error) {
    console.error('There was a problem with the axios operation:', error);
    return "Error."; // Or handle the error in any other way
  }
}

app.get("/dashboard", async (req, res) => {
  
  const userInfo = await getSongData("/me");
  const tracks = await getSongData("/me/tracks?limit=1");

  const summary = await getWeatherData()

  const weather = summary[0]
  const temperature = summary[1]

  let params;

  if (weather==="Sunny") {
    params = new URLSearchParams({
      limit: 10,
      seed_tracks: tracks.items[0].track.id,
      target_danceability: 0.8,
      target_energy: 0.8,
      target_valence: 1,
    });
  } else if (weather==="Clear") {
    params = new URLSearchParams({
      limit: 10,
      seed_tracks: tracks.items[0].track.id,
      target_danceability: 0.3,
      target_energy: 0.5,
    });

  } else if (weather==="Rain") {
    params = new URLSearchParams({
      limit: 10,
      seed_tracks: tracks.items[0].track.id,
      target_danceability: 0.1,
      target_energy: 0.2,
      target_valence: 0.1,
    });

  }

  const data = await getSongData("/recommendations?" + params);

  console.log("------\nWEATHER: "+ weather)
  console.log("TEMPERATURE: " + temperature)
  console.log("------\nDATA:\n" + data.tracks)

  res.render("dashboard", { user: userInfo, tracks : data.tracks, weather: weather, temperature: temperature, city: summary[2]});
});


app.get("/recommendations", async (req, res) => {
  const artist_id = req.query.artist;
  const track_id = req.query.track;

  const params = new URLSearchParams({
    seed_tracks: track_id,
    seed_artists: artist_id,
  });

  const data = await getSongData("/recommendations?" + params);
  res.render("recommendation", { tracks: data.tracks });
});

// Route to handle POST requests from the client
app.post('/alert-server', (req, res) => {
  // Log the data received from the client
  console.log(req.body);
  // Send a response to the client
  res.sendStatus(200); // Sending HTTP status code 200 (OK)
  res.render("recommendation", { tracks: data.tracks });
});


let listener = app.listen(3000, function () {
  console.log(
    "Your app is listening on http://localhost:" + listener.address().port
  );
});

