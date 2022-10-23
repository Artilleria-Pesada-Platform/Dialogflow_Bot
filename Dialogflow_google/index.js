/**
* Copyright 2020 Google Inc. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
"use strict";
const functions = require("firebase-functions");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Card, Payload } = require("dialogflow-fulfillment");
const { BigQuery } = require("@google-cloud/bigquery");
const bigquery = new BigQuery({
    projectId: "bbva-latam-hack22mex-5001"
});
process.env.DEBUG = "dialogflow:debug";
/*function welcome(agent) {
    agent.add(`Welcome to my agent!`);
}
function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
}*/
async function getStatusATM(agent) {
   const ID = agent.parameters.any; //Para obtener el ID del ATM dado por el usuario
   console.log(ID);
    const sqlQuery = `DECLARE TIEMPO_ACTUAL TIMESTAMP;
DECLARE TIEMPO_DEFAULT TIMESTAMP;
DECLARE UPTIME TIMESTAMP;
DECLARE STATUS_FALLA STRING;
DECLARE ATM_ID_TWILIO STRING;

SET ATM_ID_TWILIO = @ATM_ID;
--"2967"
--"14"

SET TIEMPO_ACTUAL = TIMESTAMP_ADD(CAST(CURRENT_DATETIME("America/Mexico_City") AS TIMESTAMP), INTERVAL -61 DAY);

IF (ATM_ID_TWILIO IN (SELECT ATM_ID FROM bbva-latam-hack22mex-5001.ATM.TABLA_FALLAS )) THEN
SET STATUS_FALLA = "SIESTA";
SET UPTIME = (SELECT MAX(FECHA_FIN) FROM bbva-latam-hack22mex-5001.ATM.TABLA_FALLAS WHERE ATM_ID=ATM_ID_TWILIO AND FECHA_INICIO< TIEMPO_ACTUAL);
ELSE
SET STATUS_FALLA = "NOESTA";
SET UPTIME = PARSE_TIMESTAMP("%Y-%m-%d %H:%M:%S", "2022-08-01 00:00:00");
END IF;


SELECT ATM.ATM AS ATM_ID, ATM.Latitud AS Latitud,ATM.Longitud AS Longitud, ATM.Sitio AS Sitio, INF.FALLA AS FALLA, INF.INICIO AS INICIO, INF.FIN AS FIN, 

CASE WHEN INF.FALLA IS NULL THEN "SIN FALLA" ELSE "CON FALLA" END STATUS,

case when INF.FALLA IS NULL THEN null ELSE TIMESTAMP_DIFF(TIEMPO_ACTUAL, INF.INICIO, MINUTE) END ULTIMO_ESTATUS_ACTIVO,

case when INF.FALLA IS NULL THEN UPTIME ELSE NULL END UPTIME_T

FROM(
SELECT TF.ATM_ID AS ATM_ID, ATM.Latitud AS Latitud,ATM.Longitud AS Longitud, ATM.Sitio AS Sitio, TF.FALLA AS FALLA, TF.FECHA_INICIO AS INICIO, TF.FECHA_FIN AS FIN
FROM 
bbva-latam-hack22mex-5001.ATM.TABLA_FALLAS AS TF
RIGHT JOIN
bbva-latam-hack22mex-5001.ATM.TABLA_ATM AS ATM
ON
ATM.ATM = TF.ATM_ID
WHERE TF.ATM_ID = ATM_ID_TWILIO 
AND TF.FECHA_INICIO<= TIEMPO_ACTUAL AND TF.FECHA_FIN>=TIEMPO_ACTUAL) AS INF
RIGHT JOIN
(SELECT ATM, Latitud,Longitud, Sitio  FROM bbva-latam-hack22mex-5001.ATM.TABLA_ATM WHERE ATM = ATM_ID_TWILIO ) AS ATM
ON
ATM.ATM = INF.ATM_ID
`;
    const options = {
        query: sqlQuery,
        location: "US",
        params: {
            ATM_ID: ID.toUpperCase()
        }
    };
    const [rows] = await bigquery.query(options);
    console.log(rows);
    console.log(rows[0].Sitio);

    return rows;
}
/*async function IDCollect(agent) {
    const email = agent.getContext('submitticket-email-followup').parameters.email;
    const issueCategory = agent.getContext('submitticket-email-followup').parameters.category;
    let etaPrediction = await etaPredictionFunction(agent);
    agent.setContext({
        name: "submitticket-collectname-followup",
        lifespan: 2
    });
    agent.add(`Your ticket has been created. Someone will contact you shortly at ${email}.
    The estimated response time is ${etaPrediction[0].predicted_label} days.`);
}*/
async function IDCollect(agent) {
   //const email = agent.getContext('submitticket-email-followup').parameters.email;
   const ID = agent.parameters.any; //Para obtener el ID del ATM dado por el usuario
   let statusATM = await getStatusATM(agent); //Función para conectar con BigQuery
   console.log('El status es ' + statusATM);
  console.log('El status es ' + statusATM[0]);
  console.log('El status es ' + statusATM[0].STATUS);

  //agent.add(`El status del ATM ${ID} es: ${statusATM[0].STATUS}`);
  if (statusATM[0].STATUS == "SIN FALLA"){
   agent.add(`El status del ATM ${ID} es: *${statusATM[0].STATUS}*\n El ATM lleva sin fallas desde: ${statusATM[0].UPTIME_T.value}\nUbicación: ${statusATM[0].Sitio}\n https://www.google.com/maps/search/?api=1&query=${statusATM[0].Latitud},${statusATM[0].Longitud}`);
   console.log(`El status del ATM ${ID} es: ${statusATM[0].STATUS}\n El ATM lleva sin fallas desde: ${statusATM[0].UPTIME_T.value}\nUbicación: ${statusATM[0].Sitio}\n https://www.google.com/maps/search/?api=1&query=${statusATM[0].Latitud},${statusATM[0].Longitud}`);
  }
  else {
     agent.add(`El status del ATM ${ID} es: *${statusATM[0].STATUS}*\n Tipo de falla: *${statusATM[0].FALLA}*\n Tiempo desde que inicio la falla: ${statusATM[0].ULTIMO_ESTATUS_ACTIVO} minutos \n Ubicación: ${statusATM[0].Sitio}\n https://www.google.com/maps/search/?api=1&query=${statusATM[0].Latitud},${statusATM[0].Longitud}`);
     console.log('Fallando!');
  }
   //agent.add(`El estado del equipo ${ID} es: ${statusATM[0].Sitio}`);
   //agent.add(`El estado del equipo ${ID} es: jeje`);
}


async function getATMs(agent) {
   const lat = agent.parameters.latitud; //Para obtener el ID del ATM dado por el usuario
   let long = agent.parameters.longitud; //Para obtener el ID del ATM dado por el usuario
   let dist = agent.parameters.distance; //Para obtener el ID del ATM dado por el usuario
   const unit = agent.parameters.unidad; //Para obtener el ID del ATM dado por el usuario
  const sign = agent.parameters.signo; //Para obtener el ID del ATM dado por el usuario
  console.log(long);
  if (unit == "m"){ dist = dist/1000;}
  if(sign == "-"){long = long*-1;}
    const sqlQuery = `
DECLARE ACTUAL_DAY STRING;
DECLARE ACTUAL_HOUR STRING;

SET ACTUAL_DAY = CAST(FORMAT_DATETIME("%a", CURRENT_DATETIME("America/Mexico_City") ) AS STRING);
SET ACTUAL_HOUR = CAST(FORMAT_DATETIME("%H", CURRENT_DATETIME("America/Mexico_City") ) AS STRING);

CREATE TEMPORARY FUNCTION Degrees(radians FLOAT64) RETURNS FLOAT64 AS
(
  (radians*180)/(22/7)
);

CREATE TEMPORARY FUNCTION Radians(degrees FLOAT64) AS (
  (degrees*(22/7))/180
);

CREATE TEMPORARY FUNCTION DistanciaKm(lat FLOAT64, lon FLOAT64, lat1 FLOAT64, lon1 FLOAT64) AS (
     Degrees( 
      ACOS( 
        COS( Radians(lat1) ) * 
        COS( Radians(lat) ) *  
        COS( Radians(lon1 ) -  
        Radians( lon ) ) +  
        SIN( Radians(lat1) ) *  
        SIN( Radians( lat ) ) 
        ) 
    ) * 111.045
);
# El valor 111.045Km  para aproximar la distancia por un grado.
# Los valores 28.629449, -106.075458 seran variables de acuerdo al punto dado 
# El valor 0.1 es la distancia del radio del punto dado también variable y representado en KM en este caso el radio es de 100m

IF CAST(ACTUAL_HOUR AS INT64)>=0 AND CAST(ACTUAL_HOUR AS INT64)<3 THEN
SET ACTUAL_HOUR = "00";
ELSEIF CAST(ACTUAL_HOUR AS INT64)>=3 AND CAST(ACTUAL_HOUR AS INT64)<6 THEN
SET ACTUAL_HOUR = "03";
ELSEIF CAST(ACTUAL_HOUR AS INT64)>=6 AND CAST(ACTUAL_HOUR AS INT64)<9 THEN
SET ACTUAL_HOUR = "06";
ELSEIF CAST(ACTUAL_HOUR AS INT64)>=9 AND CAST(ACTUAL_HOUR AS INT64)<12 THEN
SET ACTUAL_HOUR = "09";
ELSEIF CAST(ACTUAL_HOUR AS INT64)>=12 AND CAST(ACTUAL_HOUR AS INT64)<15 THEN
SET ACTUAL_HOUR = "12";
ELSEIF CAST(ACTUAL_HOUR AS INT64)>=15 AND CAST(ACTUAL_HOUR AS INT64)<18 THEN
SET ACTUAL_HOUR = "15";
ELSEIF CAST(ACTUAL_HOUR AS INT64)>=18 AND CAST(ACTUAL_HOUR AS INT64)<21 THEN
SET ACTUAL_HOUR = "18";
ELSEIF CAST(ACTUAL_HOUR AS INT64)>=21 AND CAST(ACTUAL_HOUR AS INT64)<24 THEN
SET ACTUAL_HOUR = "21";
END IF;



SELECT ATM.ATM, ATM.DIVISION, ATM.SITIO, ATM.Latitud, ATM.Longitud, DistanciaKm(ATM.latitud, ATM.longitud, 28.629449, -106.075458), CASE WHEN DC.TIEMPO_ESPERA IS NULL THEN 0.0 ELSE DC.TIEMPO_ESPERA END AS TIEMPO_ESPERA
FROM 
bbva-latam-hack22mex-5001.ATM.TABLA_ATM AS ATM 
LEFT JOIN
bbva-latam-hack22mex-5001.ATM.DISPONIBILIDAD_CAJEROS DC
ON ATM.ATM =DC.ATM_ID
WHERE 
DC.DIA_SEMANA = ACTUAL_DAY
AND DC.HORAS = ACTUAL_HOUR
AND
DistanciaKm(latitud, longitud, @latitud, @longitud) < @distancia
`;
    const options = {
        query: sqlQuery,
        location: "US",
        params: {
            distancia: dist,
            latitud: lat,
            longitud: long
        }
    };
    const [rows] = await bigquery.query(options);
    console.log(rows);
    console.log(rows.length);
    return rows;
}

async function ATMGet(agent) {
   //const email = agent.getContext('submitticket-email-followup').parameters.email;
   const lat = agent.parameters.latitud; //Para obtener el ID del ATM dado por el usuario
   const long = agent.parameters.longitud; //Para obtener el ID del ATM dado por el usuario
   const dist = agent.parameters.distance; //Para obtener el ID del ATM dado por el usuario
   const unit = agent.parameters.unidad; //Para obtener el ID del ATM dado por el usuario
    const sign = agent.parameters.signo; //Para obtener el ID del ATM dado por el usuario
   let ATMs = await getATMs(agent); //Función para conectar con BigQuery
   let str = '';
   let temp_ant = '';
  let cont = 0;
   //ATMs.forEach(row => console.log(`Ubicación: ${row.Sitio}\n https://www.google.com/maps/search/?api=1&query=${row.Latitud},${row.Longitud}`));
  console.log(ATMs.length); 
  if(ATMs.length>0){
     ATMs.forEach(row => {
     let temp = row.SITIO;
     if (temp != temp_ant){
     str += `Ubicación: ${row.SITIO}\n Tiempo de espera aproximado: ${row.TIEMPO_ESPERA} minutos\nhttps://www.google.com/maps/search/?api=1&query=${row.Latitud},${row.Longitud}\n`;
     cont ++;}
   	 temp_ant = temp;
   });
   console.log('Se encontró ' + str);
  //console.log('El status es ' + ATMs[0].SITIO);
  if(cont<11){
//  agent.add(`En el punto ${lat}, ${long} a ${dist} ${unit} no hay nada alv`);
  agent.add(`Se encontraron *${cont} ubicacion(es)* con ATMs en un rango de ${dist} ${unit} alrededor de las coordenadas ${lat}, ${sign}${long}:\n\n${str}`);}
  else{
    console.log('El arreglo es muy grande!');
    agent.add(`El número de ubicaciones de cajeros disponibles es muy grande, intenta repetir tu búsqueda con un radio de solicitud menor`);
  }}
  else{    agent.add(`No se encontraron cajeros disponibles en esa zona, intenta incrementar la distancia de búsqueda o cambiar la latitud y longitud`);
}
   //agent.add(`El estado del equipo ${ID} es: ${statusATM[0].Sitio}`);
   //agent.add(`El estado del equipo ${ID} es: jeje`);
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
    let intentMap = new Map();
    //intentMap.set("Default Welcome Intent", welcome);
    //intentMap.set("Default Fallback Intent", fallback);
    intentMap.set("ID_fallas", IDCollect);
    intentMap.set("Location_data", ATMGet);
    agent.handleRequest(intentMap);
});