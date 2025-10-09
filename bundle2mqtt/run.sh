#!/usr/bin/with-contenv bashio
set +u

export MQTT_HOST=$(bashio::services mqtt "host")
export MQTT_PORT=$(bashio::services mqtt "port")
export MQTT_USER=$(bashio::config 'mqtt_user')
export MQTT_PASS=$(bashio::config 'mqtt_pass')
export MQTT_HA_DISCOVERY_PREFIX=$(bashio::config 'mqtt_ha_discovery_prefix')
export MQTT_BRIDGE_TOPIC_PREFIX=$(bashio::config 'mqtt_bridge_topic_prefix')
export MQTT_DISCOVERY_SEND_DELAY=$(bashio::config 'mqtt_discovery_send_delay')
export LX1_USER=$(bashio::config 'lx1_user')
export LX1_PASS=$(bashio::config 'lx1_pass')

bashio::log.info "Starting bundle2mqtt service."
npm run start