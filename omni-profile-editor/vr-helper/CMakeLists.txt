cmake_minimum_required(VERSION 3.20)
project(vr-helper)
set(CMAKE_CXX_STANDARD 17)

add_executable(vr-helper main.cpp)
target_include_directories(vr-helper PRIVATE "${CMAKE_SOURCE_DIR}/openvr/headers")
target_link_libraries(vr-helper PRIVATE "${CMAKE_SOURCE_DIR}/openvr/lib/win64/openvr_api.lib")
target_compile_definitions(vr-helper PRIVATE _CRT_SECURE_NO_WARNINGS)

find_package(Threads REQUIRED)
target_link_libraries(vr-helper PRIVATE Threads::Threads)
