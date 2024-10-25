FROM postgres:alpine

COPY init_db.sql /docker-entrypoint-initdb.d/
COPY postgresql.conf /etc/postgresql/postgresql.conf 

EXPOSE 5432
