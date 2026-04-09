DROP DATABASE IF EXISTS teamder;
CREATE DATABASE teamder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE teamder;

CREATE TABLE usuarios(
	id INT PRIMARY KEY NOT NULL UNIQUE AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE,
    nombre VARCHAR(255),
    correo VARCHAR(255) UNIQUE,
    contrasena VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
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
    provincia VARCHAR(255),
    municipio VARCHAR(255),
    pista VARCHAR(255),
	modalidad VARCHAR(255),
    fecha DATE,
    hora TIME,
    huecos INT,
    huecos_inscritos INT,
    latitud DOUBLE,
    longitud DOUBLE,
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

CREATE TABLE partido_grupo(
	id INT PRIMARY KEY NOT NULL UNIQUE AUTO_INCREMENT,
    id_partido INT,
    id_grupo INT,
    CONSTRAINT fk_pg_partido FOREIGN KEY (id_partido) REFERENCES partidos(id),
    CONSTRAINT fk_pg_grupo FOREIGN KEY (id_grupo) REFERENCES grupos(id)
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

CREATE TABLE amistades(
    id INT PRIMARY KEY NOT NULL UNIQUE AUTO_INCREMENT,
    id_usuario1 INT,
    id_usuario2 INT,
    estado VARCHAR(50) CHECK (estado='pendiente' OR estado='aceptada' OR estado='rechazada') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_amistad_usuario1 FOREIGN KEY (id_usuario1) REFERENCES usuarios(id),
    CONSTRAINT fk_amistad_usuario2 FOREIGN KEY (id_usuario2) REFERENCES usuarios(id)
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
-- Contraseñas hasheadas con bcrypt (contraseña original: 1234)
INSERT INTO usuarios(username, nombre, correo, contrasena, edad, telefono) VALUES('luiss', 'Luis', 'luis@gmail.com', '$2a$10$KT8TSu186eHenzOmLF4S6.TPmhHtkOnNlAIxjSF2hP.UfhbbQkksq', 23, 601266116);
INSERT INTO usuarios(username, nombre, correo, contrasena, edad, telefono) VALUES('juanito', 'Juan', 'juan@gmail.com', '$2a$10$KT8TSu186eHenzOmLF4S6.TPmhHtkOnNlAIxjSF2hP.UfhbbQkksq', 24, 111222333);
INSERT INTO usuarios(username, nombre, correo, contrasena, edad, telefono) VALUES('mariag', 'María', 'maria@gmail.com', '$2a$10$KT8TSu186eHenzOmLF4S6.TPmhHtkOnNlAIxjSF2hP.UfhbbQkksq', 22, 612345678);
INSERT INTO usuarios(username, nombre, correo, contrasena, edad, telefono) VALUES('pedrop', 'Pedro', 'pedro@gmail.com', '$2a$10$KT8TSu186eHenzOmLF4S6.TPmhHtkOnNlAIxjSF2hP.UfhbbQkksq', 25, 698765432);

INSERT INTO grupos(nombre, integrantes) VALUES ('Amigos CF', 2);
INSERT INTO grupos(nombre, integrantes) VALUES ('Los chavales', 1);
INSERT INTO grupos(nombre, integrantes) VALUES ('Supercolegas del infierno', 2);
INSERT INTO grupos(nombre, integrantes) VALUES ('Los mas guais de cai', 1);
INSERT INTO grupos(nombre, integrantes) VALUES ('Juguemos', 1);

INSERT INTO usuario_grupo(id_grupo, id_usuario, es_admin) VALUES (1, 1, true);
INSERT INTO usuario_grupo(id_grupo, id_usuario, es_admin) VALUES (1, 2, false);
INSERT INTO usuario_grupo(id_grupo, id_usuario, es_admin) VALUES (2, 2, true);
INSERT INTO usuario_grupo(id_grupo, id_usuario, es_admin) VALUES (3, 1, false);
INSERT INTO usuario_grupo(id_grupo, id_usuario, es_admin) VALUES (3, 3, true);
INSERT INTO usuario_grupo(id_grupo, id_usuario, es_admin) VALUES (4, 4, true);
INSERT INTO usuario_grupo(id_grupo, id_usuario, es_admin) VALUES (5, 3, true);

INSERT INTO partidos(provincia, municipio, pista, modalidad, fecha, hora, huecos, huecos_inscritos) VALUES('Cádiz', 'Cádiz', 'Pista Loreto', 'Futbol Sala', '2026-06-20', '20:00:00', 10, 3);
INSERT INTO partidos(provincia, municipio, pista, modalidad, fecha, hora, huecos, huecos_inscritos) VALUES('Cádiz', 'Cádiz', 'Pista Loreto', 'Futbol Sala', '2026-06-20', '16:00:00', 10, 2);
INSERT INTO partidos(provincia, municipio, pista, modalidad, fecha, hora, huecos, huecos_inscritos) VALUES('Cádiz', 'Cádiz', 'Elcano', 'Futbol 7', '2026-06-20', '17:00:00', 14, 1);
INSERT INTO partidos(provincia, municipio, pista, modalidad, fecha, hora, huecos, huecos_inscritos) VALUES('Cádiz', 'Jerez de la Frontera', 'Pabellón Gadir', 'Futbol Sala', '2026-06-20', '23:00:00', 10, 2);
INSERT INTO partidos(provincia, municipio, pista, modalidad, fecha, hora, huecos, huecos_inscritos, id_grupo) VALUES('Cádiz', 'Cádiz', 'Campo hondo', 'Baloncesto', '2026-06-20', '23:00:00', 10, 2, 1);
INSERT INTO partidos(provincia, municipio, pista, modalidad, fecha, hora, huecos, huecos_inscritos, id_grupo) VALUES('Sevilla', 'Sevilla', 'Polideportivo San Pablo', 'Futbol Sala', '2026-07-10', '19:00:00', 10, 1, 3);

-- Asociaciones partido-grupo (partidos compartidos con grupos)
INSERT INTO partido_grupo(id_partido, id_grupo) VALUES (5, 1);
INSERT INTO partido_grupo(id_partido, id_grupo) VALUES (6, 3);

-- Inscripciones consistentes con huecos_inscritos
INSERT INTO usuario_partido(id_usuario, id_partido) VALUES (1, 1);
INSERT INTO usuario_partido(id_usuario, id_partido) VALUES (2, 1);
INSERT INTO usuario_partido(id_usuario, id_partido) VALUES (3, 1);
INSERT INTO usuario_partido(id_usuario, id_partido) VALUES (1, 2);
INSERT INTO usuario_partido(id_usuario, id_partido) VALUES (4, 2);
INSERT INTO usuario_partido(id_usuario, id_partido) VALUES (3, 3);
INSERT INTO usuario_partido(id_usuario, id_partido) VALUES (2, 4);
INSERT INTO usuario_partido(id_usuario, id_partido) VALUES (4, 4);
INSERT INTO usuario_partido(id_usuario, id_partido) VALUES (1, 5);
INSERT INTO usuario_partido(id_usuario, id_partido) VALUES (2, 5);
INSERT INTO usuario_partido(id_usuario, id_partido) VALUES (1, 6);

-- Amistades
INSERT INTO amistades(id_usuario1, id_usuario2, estado) VALUES (1, 2, 'aceptada');
INSERT INTO amistades(id_usuario1, id_usuario2, estado) VALUES (1, 3, 'aceptada');
INSERT INTO amistades(id_usuario1, id_usuario2, estado) VALUES (4, 1, 'pendiente');

INSERT INTO solicitudes(id_grupo, id_usuario) VALUES(1, 3);
