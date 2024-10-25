#!/usr/bin/env lua

local DB_NAME = "bench"
local DB_USER = "bench_user"
local DB_PWD = "password123"
local DB_PORT = "5432"

local function set_env_var(name, value)
    local command = string.format("export %s=%q", name, value)
    local success = os.execute(command)
    if not success then
        io.stderr:write("Error: Failed to set environment variable " .. name .. "\n")
        os.exit(1)
    end
end

set_env_var("DATABASE", DB_NAME)
set_env_var("DB_USER", DB_USER)
set_env_var("DB_PWD", DB_PWD)

local function ensure_network_exists(network_name)
    local handle = io.popen("podman network inspect " .. network_name .. " 2>&1")
    local result = handle:read("*a")
    handle:close()
    
    if string.find(result, "no such network") then
        print("Network " .. network_name .. " does not exist. Creating...")
        local create_network_command = "podman network create " .. network_name
        local create_success = os.execute(create_network_command)
        if create_success ~= 0 then
            io.stderr:write("Error: Failed to create network " .. network_name .. ".\n")
            os.exit(1)
        end
    else
        print("Network " .. network_name .. " already exists.")
    end
end

local network_name = "bench-network"
ensure_network_exists(network_name)

local build_command = "podman build -t postgres_bench ."
local run_command = string.format(
    "podman run --replace -d --name postgres_bench --network=host " ..
    "-e POSTGRES_DB=%q -e POSTGRES_USER=%q -e POSTGRES_PASSWORD=%q " ..
    "--ulimit nofile=65536:65536 -p %s:5432 postgres_bench",
    DB_NAME, DB_USER, DB_PWD, DB_PORT
)

print("Building the container image...")
local build_success = os.execute(build_command)
if not build_success then
    io.stderr:write("Error: Failed to build the container image.\n")
    os.exit(1)
end

print("Running the container...")
local run_success = os.execute(run_command)
if not run_success then
    io.stderr:write("Error: Failed to run the container.\n")
    os.exit(1)
end

print("Postgres container is running successfully.")

