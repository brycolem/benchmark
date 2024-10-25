FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY ssl /etc/nginx/ssl
COPY dist/angular/browser/* /usr/share/nginx/html

EXPOSE 8000
