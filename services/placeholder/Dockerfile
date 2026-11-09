# Placeholder for a backend service (dante, spotify, airplay, tidal)
# until its own step replaces it. It logs once and idles.

FROM alpine:3.22
ARG SERVICE=placeholder
ENV PLAYERD_SERVICE=$SERVICE
COPY idle.sh /usr/local/bin/idle.sh
ENTRYPOINT ["/bin/sh", "/usr/local/bin/idle.sh"]
