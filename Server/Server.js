"use strict";

//Имя процесса, можно увидеть через команду top
process.title = 'thebestrate';

var BR = global.BR = {

    Connections: {}

};

BR.Config = require('./Config/Config');

//Подключаем модуль http сервера
var http = require('http');

var express = require('express');

var express_body_parser = require('body-parser');

var _ = global._ = require('underscore');

var logger = require('log4js');

//Подключаем модуль для работы с вебсокетами
var websocket = require('websocket');

require('./Classes/Service');
require('./Classes/Broadcast');

//Подключаем более красивый логгер
BR.Logger = logger.getLogger();

//Подключаем модуль для криптографии
BR.Crypto = require('crypto');

//Создаём экземпляр класса express
BR.Express = express();

//Указываем где находятся все публичные файлы
BR.Express.use(express.static(__dirname + '/../Client/'));

BR.Express.use(express_body_parser.json());

//Подключаемся к базе данных

BR.Mongoose = require('mongoose');
BR.Mongoose.connect('mongodb://localhost/thebestrate');

BR.Database = BR.Mongoose.connection;
BR.Database.on('error', console.error.bind(console, 'connection error:'));
BR.Database.once('open', function() {

    BR.Logger.debug('Connection to database established');

    //Подключаем модели данных
    require('./Services/Cache');
    require('./Services/Rates');
    require('./Services/Grabber');

    Broadcast.call('Database Ready');

    BR.Grabber.run();

    Broadcast.on('Database Cache Ready', function() {

        //Запускаем http сервер на порту 3000 для выдачи статического контента
        var http_server = http.createServer(BR.Express);

        http_server.listen(BR.Config.Port, function() {

            BR.Logger.debug("Express server listening on port " + BR.Config.Port);

            //Создаём объект WebSocket сервера
            var websocket_server = new websocket.server({

                httpServer: http_server

            });

            var cid = 1;

            websocket_server.on('request', function(request) {

                //Уникальный id соединения
                var connection_id = cid++;

                var ConnectionData = BR.Connections[connection_id] = {
                    ConnectionID: connection_id,
                    Connection: request.accept(null, request.origin)
                };

                BR.Logger.debug("Connection #"+connection_id+" accepted.");

                Broadcast.call('User Connected', [ConnectionData]);

                //Реакция на посылку сообщения
                ConnectionData.Connection.on('message', function(message) {

                    //Принимаем только текст (JSON string)
                    if (message.type == 'utf8') {

                        //Получаем объект
                        var data = JSON.parse(message.utf8Data);
                        if (!data) return;

                        BR.Logger.debug("Received message from connection #"+connection_id+": " + message.utf8Data);

                        Broadcast.call('Client Data Received', [ConnectionData, data]);

                    }

                });

                //Реакция на отключение
                ConnectionData.Connection.on('close', function() {

                    BR.Logger.debug("Connection #"+connection_id+" closed.");

                    Broadcast.call('User Disconnected', [ConnectionData]);

                });

            });

        });

    }, this);

});

BR.SendToConnection = function(connection_data, data) {

    //BR.Logger.debug('Send to connection #' + connection_data.ConnectionID + ': ', data);

    connection_data.Connection.sendUTF(JSON.stringify(data));

};

BR.SendToAllConnections = function(data) {

    _.each(BR.Connections, function(connection_data) {

        BR.SendToConnection(connection_data, data);

    }, this);

};

BR.SendHttpResult = function(res, data) {

    res.send(JSON.stringify(data));

};
