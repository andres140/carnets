-- Sprint 5 — PDF, plantillas e historial de documentos
USE sena_carnets;

ALTER TABLE carnets ADD COLUMN pdf_generado_at DATETIME NULL AFTER pdf_url;
ALTER TABLE carnets ADD COLUMN pdf_hash VARCHAR(64) NULL AFTER pdf_generado_at;
ALTER TABLE carnets ADD COLUMN template_id VARCHAR(50) NOT NULL DEFAULT 'default' AFTER pdf_hash;
ALTER TABLE carnets ADD COLUMN reimpresiones_count INT NOT NULL DEFAULT 0 AFTER template_id;

CREATE TABLE IF NOT EXISTS carnet_documentos_historial (
  id            VARCHAR(36) NOT NULL PRIMARY KEY,
  carnet_id     VARCHAR(36) NOT NULL,
  accion        ENUM('GENERAR','DESCARGAR','IMPRIMIR','REIMPRIMIR') NOT NULL,
  usuario_id    VARCHAR(36) NOT NULL,
  detalle_json  JSON         NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_carnet_doc_carnet (carnet_id),
  KEY idx_carnet_doc_fecha (created_at),
  CONSTRAINT fk_carnet_doc_carnet
    FOREIGN KEY (carnet_id) REFERENCES carnets(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_carnet_doc_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;
