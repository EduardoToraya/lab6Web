const request = require("request")

const express = require("express")
const app = express()
const port = process.env.PORT || 3000;

if(process.env.NODE_ENV == "production"){
  var mapbox_token = process.env.MAPBOX_TOKEN
  var darksky_secret_key = process.env.DARK_SKY_SECRET_KEY;
}
else{
  const credentials = require("./credentials")
  var mapbox_token = credentials.MAPBOX_TOKEN
  var darksky_secret_key = credentials.DARK_SKY_SECRET_KEY
}


app.get("/weather", function(req,res){
  if(!req.query.search){
    res.send({
      error: "Debe existir un parámetro en search"
    })
  }
  else{
    getCoordinates(req.query.search, function(MBerror, center){
      if(MBerror){
        return res.send({
          error: MBerror
        })
      }
      else{
        getWeather(center, function(DSerror, output){
          if(DSerror){
            return res.send({
              error: DSerror
            })
          }
          else{
            return res.send({
              response: output
            })
          }
        })
      }
    })
  }
})

app.get("*", function(req,res){
  res.send({
    error: "Ruta no valida"
  })
})

const getWeather = function(center, callback){
  const url = "https://api.darksky.net/forecast/" + darksky_secret_key + "/"
              +center[1] + "," + center[0] + "?lang=es&units=si"

  request({url, json: true}, function(error, response){
    if(error){
      callback(error, undefined)
    }
    else if(response.body["error"]){
      callback(response.body["error"], undefined)
    }
    else{
        const data = response.body["currently"]
        const msg = data.summary + ". La temperatura actual es: " + String(data.temperature) +
                    " grados Celcius. Existe " + String(data.precipProbability) + "% de probabilidad de lluvia." +
                    "\n"+ " Información adicional:" + "\n Sensación de temperatura: " + String(data.apparentTemperature)
                              + " grados Celcius.\n Humedad: " + String(data.humidity * 100) + "%"
                              + "\n Indice UV: " + String(data.uvIndex)
        callback(error, msg)
    }


  })
}

const getCoordinates = function(city, callback){
  const url = "https://api.mapbox.com/geocoding/v5/mapbox.places/" + city +
              ".json?access_token=" + mapbox_token
  request({url, json: true}, function(error,response){
    if(error){
      callback(error, undefined)
    }
    else if(response.body.message){
      callback(response.body.message, undefined)
    }
    else if(!response.body["features"][0]){
      callback("city not found", undefined)
    }
    else{
      const data = response.body
      const center = data["features"][0]["center"]
      callback(undefined, center)
    }
  })
}

getCoordinates("Tabasco", function(error, center){
  if(error){
    console.log(error)
  }
  else{
    getWeather(center, function(error2, output){
      if(error2){
        console.log(error2)
      }
      else{
        console.log(output)
      }
    })
  }
})

app.listen(port, function(){
  console.log("Listening on port " + port)
})
