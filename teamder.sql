DROP DATABASE IF EXISTS teamder;
CREATE DATABASE teamder;
USE teamder;

CREATE TABLE usuarios(
	id INT PRIMARY KEY NOT NULL UNIQUE AUTO_INCREMENT,
    nombre VARCHAR(255) UNIQUE,
    correo VARCHAR(255),
    contrasena VARCHAR(255),
    edad INT,
    telefono BIGINT,
    descripcion TEXT
);

CREATE TABLE grupos(
	id INT PRIMARY KEY NOT NULL UNIQUE AUTO_INCREMENT,
    nombre VARCHAR(255),
    integrantes INT
);

CREATE TABLE partidos(
	id INT PRIMARY KEY NOT NULL UNIQUE AUTO_INCREMENT,
    municipio VARCHAR(255),
    pista VARCHAR(255),
	modalidad VARCHAR(255),
    fecha DATE,
    hora TIME,
    huecos INT,
    huecos_inscritos INT,
    id_grupo INT,
    CONSTRAINT fk_partido_grupo FOREIGN KEY (id_grupo) REFERENCES grupos(id)
);

CREATE TABLE usuario_partido(
	id INT PRIMARY KEY NOT NULL UNIQUE AUTO_INCREMENT,
    id_usuario INT,
    id_partido INT,
    equipo BOOL,
    CONSTRAINT fk_usuario_partido FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
    CONSTRAINT fk_partido_usuario FOREIGN KEY (id_partido) REFERENCES partidos(id)
);

CREATE TABLE usuario_grupo(
	id INT PRIMARY KEY NOT NULL UNIQUE AUTO_INCREMENT,
	id_grupo INT,
    id_usuario INT,
    es_admin BOOLEAN,
    CONSTRAINT fk_usuario_grupo FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
    CONSTRAINT fk_grupo_usuario FOREIGN KEY (id_grupo) REFERENCES grupos(id)
);

CREATE TABLE solicitudes (
    id INT PRIMARY KEY NOT NULL UNIQUE AUTO_INCREMENT,
    id_grupo INT,
    id_usuario INT,
    estado VARCHAR(255) CHECK (estado='aceptada' OR estado='rechazada' OR estado='pendiente') DEFAULT 'pendiente',
    CONSTRAINT fk_grupo_solicitudes FOREIGN KEY (id_grupo) REFERENCES grupos(id),
    CONSTRAINT fk_usuario_solicitudes FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);

CREATE TABLE historial(
	id INT PRIMARY KEY NOT NULL UNIQUE AUTO_INCREMENT,
    id_usuario INT,
    id_partido INT,
    CONSTRAINT fk_usuario_historial FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
    CONSTRAINT fk_partido_historial FOREIGN KEY (id_partido) REFERENCES partidos(id)
);

SET GLOBAL event_scheduler = ON;
DELIMITER $$

CREATE EVENT IF NOT EXISTS mover_partidos_a_historial
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
    DECLARE fecha_actual DATE;
    DECLARE hora_actual TIME;

    SET fecha_actual = CURDATE();
    SET hora_actual = CURTIME();

    INSERT INTO historial (id_usuario, id_partido)
    SELECT up.id_usuario, up.id_partido
    FROM usuario_partido up
    JOIN partidos p ON up.id_partido = p.id
    WHERE (p.fecha < fecha_actual OR (p.fecha = fecha_actual AND p.hora < hora_actual));

    DELETE up FROM usuario_partido up
    JOIN partidos p ON up.id_partido = p.id
    WHERE (p.fecha < fecha_actual OR (p.fecha = fecha_actual AND p.hora < hora_actual));
END$$

DELIMITER ;

-- Datos de prueba
INSERT INTO usuarios(nombre, correo, contrasena, edad, telefono) VALUES('Luis', 'luis@gmail.com', '1234', 23, 601266116);
INSERT INTO usuarios(nombre, correo, contrasena, edad, telefono) VALUES('Juan', 'juan@gmail.com', '1234', 24, 111222333);

INSERT INTO grupos(nombre) VALUES ('Amigos CF');
INSERT INTO grupos(nombre) VALUES ('Los chavales');
INSERT INTO grupos(nombre) VALUES ('Supercolegas del infierno');
INSERT INTO grupos(nombre) VALUES ('Los mas guais de cai');
INSERT INTO grupos(nombre) VALUES ('Juguemos');

INSERT INTO usuario_grupo(id_grupo, id_usuario, es_admin) VALUES (1, 1, true);
INSERT INTO usuario_grupo(id_grupo, id_usuario, es_admin) VALUES (3, 1, false);

INSERT INTO partidos(municipio, pista, modalidad, fecha, hora, huecos, huecos_inscritos) VALUES('Cádiz', 'Pista Loreto', 'Futbol Sala', '2025-06-20', '20:00:00', 10, 8);
INSERT INTO partidos(municipio, pista, modalidad, fecha, hora, huecos, huecos_inscritos) VALUES('Cádiz', 'Pista Loreto', 'Futbol Sala', '2025-06-20', '16:00:00', 10, 7);
INSERT INTO partidos(municipio, pista, modalidad, fecha, hora, huecos, huecos_inscritos) VALUES('Cádiz', 'Elcano', 'Futbol 7', '2025-06-20', '17:00:00', 10, 5);
INSERT INTO partidos(municipio, pista, modalidad, fecha, hora, huecos, huecos_inscritos) VALUES('Cádiz', 'Pabellón Gadir', 'Futbol Sala', '2025-06-20', '23:00:00', 10, 8);
INSERT INTO partidos(municipio, pista, modalidad, fecha, hora, huecos, huecos_inscritos, id_grupo) VALUES('Cádiz', 'Campo hondo', 'Baloncesto', '2025-06-20', '23:00:00', 10, 8, 1);
INSERT INTO partidos(municipio, pista, modalidad, fecha, hora, huecos, huecos_inscritos, id_grupo) VALUES('Cádiz', 'Pista Loreto', 'Futbol Sala', '2024-06-20', '23:00:00', 10, 8, 1);

INSERT INTO usuario_partido(id_usuario, id_partido) VALUES (1, 1);
INSERT INTO usuario_partido(id_usuario, id_partido) VALUES (1, 2);
INSERT INTO usuario_partido(id_usuario, id_partido) VALUES (1, 6);

INSERT INTO solicitudes(id_grupo, id_usuario) VALUES(1, 2);
