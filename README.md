# Dialogflow_Bot
Archivoc para implementar un asistente virtual utilizando Dialogflow conectado con Twilio, WhatsApp y BigQuery utilizando Google Cloud Functions

Para realizar la integración de Twilio con Dialogflow se siguieron las instrucciones mostradas en el repositorio de GoogleCloudPlatform/dialogflow-integrations https://github.com/GoogleCloudPlatform/dialogflow-integrations/tree/master/twilio#readme


## Instrucciones de uso del bot 
El bot implementado en WhatsApp puede ser probado con cualquier número que tenga cuenta en esta red social. Para conectarse al sandbox de Twilio donde se prueba el bot primero se debe agregar el número +1 415 523 8886 y enviar el código join difficulty-mud como mensaje de texto. Recibiremos una respuesta de confirmación por parte del sandbox diciendo que la integración está lista. 
![image](https://user-images.githubusercontent.com/60095090/197400306-30348767-6c0d-40c4-babc-6f25dfcda2d1.png)



Al escribir "Hola" al bot, el bot nos regresa un saludo inicial y nos muestra dos funciones que tiene implementadas: obtener el status de un ATM dando el ID y obtener los ATM cercanos a una latitud y longitud dadas. 

![image](https://user-images.githubusercontent.com/60095090/197400367-179c7a28-e763-4a15-be51-13a46d067da8.png)

Para la primer función, podemos escribir solicitudes como: "Status ATM", "Status ATM 120", "Conocer status cajero E392", donde si el ID no se proporciona inicialmente, el bot lo solicitará para llevar a cabo la búsqueda, misma que al encontrar una coincidencia con la base de datos, devuelve el estado del cajero, su ubicación, en caso de estar con falla muestra el tiempo que lleva la falla activa y el tipo de falla, y en caso de no tener fallas, muestra la última vez que se presentó alguna, para poder anticipar un mantenimiento.
Cajero sin falla:
![image](https://user-images.githubusercontent.com/60095090/197400639-3c1360a6-0df9-4de4-a684-525bac30b02a.png)
Cajero con falla: 
![image](https://user-images.githubusercontent.com/60095090/197400669-e14fdaf6-2e49-4cef-b7a7-e84229aca743.png)
#### Algo muy importante a mencionar es que para las fallas, se está utilizando el dataset del mes de agosto como si fuera el mes actual, ya que solo se nos proporcionó el dataset de ese mes. Es decir, si yo mando un mensaje al bot el 23 de octubre a las 10:24 am, el programa tomará en cuenta como si fuera el 23 de agosto a las 10:24 am para poder comprobar si durante ese intervalo hay alguna falla, como si se trataran de datos en tiempo real.

Adicionalmente, se puede solicitar los cajeros cercanos a una distancia dada por el usuario y a una latitud y longitud determinadas:
![image](https://user-images.githubusercontent.com/60095090/197400847-c6ab4f40-2ebe-43be-aa9f-312cd24a5e17.png)

En caso de no haber coincidencias para el radio dado por el usuario, se le sugiere incrementar el radio de su búsqueda: 

![image](https://user-images.githubusercontent.com/60095090/197400895-7254ff74-723a-41b4-a6a9-bbdbd396348c.png)

#### También cabe mencionar que se muestra el tiempo de espera aproximado en esa sucursal o cajero, dato que fue generado de forma aleatoria por los randomizers explicados con BigQuery

De igual forma, si el usuario hace solicitudes de un radio muy grande y se tienen muchos cajeros, se le sugiere reducir el radio de búsqueda:
![image](https://user-images.githubusercontent.com/60095090/197401046-cd874e43-562f-472c-b132-3c00c55cd82a.png)

