FROM nginx:alpine

COPY frontend/build /usr/share/nginx/html/

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
