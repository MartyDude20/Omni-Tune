#include <openvr.h>
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>
#include <fcntl.h>
#include <io.h>
#include <thread>
#include <mutex>
#include <atomic>
#include <string>
#include <vector>

// ── Wire protocol ──────────────────────────────────────────────────────────
// Every message: [1 byte type][4 bytes payload-length LE][payload]
// 0x01 FRAME      Electron→helper  uint32 width + uint32 height + BGRA pixels
// 0x02 STOP       Electron→helper  empty payload
// 0x03 STATUS     helper→Electron  JSON { "status": "ready"|"error", "error?": "..." }
// 0x04 EVENT      helper→Electron  JSON { "type": "mouseMove"|"mouseDown"|"mouseUp", "x": f, "y": f }
// 0x05 APP_CHANGED helper→Electron JSON { "appId": "611660" } or { "appId": null }
// 0x06 SET_WIDTH   Electron→helper  float32 LE width in meters

static std::mutex g_stdout_mutex;
static std::atomic<bool> g_running{true};

static void write_message(uint8_t type, const char* payload, uint32_t payload_len) {
    std::lock_guard<std::mutex> lock(g_stdout_mutex);
    uint8_t header[5];
    header[0] = type;
    header[1] = (uint8_t)(payload_len & 0xFF);
    header[2] = (uint8_t)((payload_len >> 8) & 0xFF);
    header[3] = (uint8_t)((payload_len >> 16) & 0xFF);
    header[4] = (uint8_t)((payload_len >> 24) & 0xFF);
    fwrite(header, 1, 5, stdout);
    if (payload_len > 0) fwrite(payload, 1, payload_len, stdout);
    fflush(stdout);
}

static void write_status(const char* status, const char* error) {
    char buf[512];
    if (error && error[0]) {
        snprintf(buf, sizeof(buf), "{\"status\":\"%s\",\"error\":\"%s\"}", status, error);
    } else {
        snprintf(buf, sizeof(buf), "{\"status\":\"%s\"}", status);
    }
    write_message(0x03, buf, (uint32_t)strlen(buf));
}

static void write_event(const char* evtype, float x, float y) {
    // OpenVR y is bottom-up (0=bottom, 720=top); flip to top-down for browser coords
    float flipped_y = 720.0f - y;
    char buf[128];
    snprintf(buf, sizeof(buf), "{\"type\":\"%s\",\"x\":%.4f,\"y\":%.4f}", evtype, x, flipped_y);
    write_message(0x04, buf, (uint32_t)strlen(buf));
}

static void write_app_changed(const char* appId) {
    char buf[128];
    if (appId && appId[0]) {
        snprintf(buf, sizeof(buf), "{\"appId\":\"%s\"}", appId);
    } else {
        snprintf(buf, sizeof(buf), "{\"appId\":null}");
    }
    write_message(0x05, buf, (uint32_t)strlen(buf));
}

// ── Event poller thread ────────────────────────────────────────────────────
static void event_thread(vr::VROverlayHandle_t mainHandle) {
    while (g_running.load()) {
        // Poll overlay input events (mouse/controller)
        vr::VREvent_t event;
        while (vr::VROverlay()->PollNextOverlayEvent(mainHandle, &event, sizeof(event))) {
            if (event.eventType == vr::VREvent_MouseMove) {
                write_event("mouseMove",
                    event.data.mouse.x,
                    event.data.mouse.y);
            } else if (event.eventType == vr::VREvent_MouseButtonDown) {
                write_event("mouseDown",
                    event.data.mouse.x,
                    event.data.mouse.y);
            } else if (event.eventType == vr::VREvent_MouseButtonUp) {
                write_event("mouseUp",
                    event.data.mouse.x,
                    event.data.mouse.y);
            }
        }

        // Poll system events (game launches/exits, SteamVR quit)
        while (vr::VRSystem()->PollNextEvent(&event, sizeof(event))) {
            if (event.eventType == vr::VREvent_SceneApplicationChanged) {
                uint32_t pid = vr::VRApplications()->GetCurrentSceneProcessId();
                if (pid == 0) {
                    write_app_changed(nullptr);
                } else {
                    char key[256] = {};
                    vr::VRApplications()->GetApplicationKeyByProcessId(pid, key, sizeof(key));
                    std::string k(key);
                    if (k.substr(0, 10) == "steam.app.") {
                        write_app_changed(k.substr(10).c_str());
                    } else {
                        write_app_changed(nullptr);
                    }
                }
            }
            if (event.eventType == vr::VREvent_Quit) {
                g_running.store(false);
            }
        }

        std::this_thread::sleep_for(std::chrono::milliseconds(11));
    }
}

// ── Stdin reader ───────────────────────────────────────────────────────────
static bool read_exact(uint8_t* buf, size_t n) {
    size_t total = 0;
    while (total < n) {
        int r = (int)fread(buf + total, 1, n - total, stdin);
        if (r <= 0) return false;
        total += (size_t)r;
    }
    return true;
}

int main(int argc, char* argv[]) {
    const char* resourcesDir = (argc >= 2) ? argv[1] : nullptr;
    // Set binary mode on stdin/stdout
    _setmode(_fileno(stdin),  _O_BINARY);
    _setmode(_fileno(stdout), _O_BINARY);

    // Init OpenVR
    vr::EVRInitError err = vr::VRInitError_None;
    vr::IVRSystem* system = vr::VR_Init(&err, vr::VRApplication_Overlay);
    if (err != vr::VRInitError_None) {
        write_status("error", vr::VR_GetVRInitErrorAsEnglishDescription(err));
        return 1;
    }

    // Create dashboard overlay
    vr::VROverlayHandle_t mainHandle  = vr::k_ulOverlayHandleInvalid;
    vr::VROverlayHandle_t thumbHandle = vr::k_ulOverlayHandleInvalid;
    vr::EVROverlayError oerr = vr::VROverlay()->CreateDashboardOverlay(
        "com.virtuix.omnitune",
        "OmniTune",
        &mainHandle,
        &thumbHandle
    );
    if (oerr != vr::VROverlayError_None) {
        write_status("error", "Failed to create dashboard overlay");
        vr::VR_Shutdown();
        return 1;
    }

    vr::VROverlay()->SetOverlayWidthInMeters(mainHandle, 2.5f);
    vr::VROverlay()->SetOverlayInputMethod(mainHandle, vr::VROverlayInputMethod_Mouse);

    // Mouse scale matches the texture dimensions so coords arrive in pixel space
    vr::HmdVector2_t mouseScale = { 1280.0f, 720.0f };
    vr::VROverlay()->SetOverlayMouseScale(mainHandle, &mouseScale);

    // Set dashboard tab thumbnail from logo.png in resources dir
    if (resourcesDir) {
        std::string logoPath = std::string(resourcesDir) + "\\Logo64.png";
        vr::VROverlay()->SetOverlayFromFile(thumbHandle, logoPath.c_str());
    }

    write_status("ready", nullptr);

    // Emit current scene app if one is already running when helper starts
    {
        uint32_t pid = vr::VRApplications()->GetCurrentSceneProcessId();
        if (pid != 0) {
            char key[256] = {};
            vr::VRApplications()->GetApplicationKeyByProcessId(pid, key, sizeof(key));
            std::string k(key);
            if (k.size() > 10 && k.substr(0, 10) == "steam.app.") {
                write_app_changed(k.substr(10).c_str());
            }
        }
    }

    // Start event poller thread
    std::thread poller(event_thread, mainHandle);

    // Main loop: read FRAME messages from stdin
    while (g_running.load()) {
        uint8_t header[5];
        if (!read_exact(header, 5)) break;  // EOF or error → exit

        uint8_t  msg_type   = header[0];
        uint32_t payload_len = (uint32_t)header[1]
                             | ((uint32_t)header[2] << 8)
                             | ((uint32_t)header[3] << 16)
                             | ((uint32_t)header[4] << 24);

        if (msg_type == 0x02) {
            // STOP
            g_running.store(false);
            break;
        }

        if (msg_type == 0x01 && payload_len >= 8) {
            // FRAME
            uint8_t size_buf[8];
            if (!read_exact(size_buf, 8)) break;
            uint32_t width  = (uint32_t)size_buf[0] | ((uint32_t)size_buf[1] << 8)
                            | ((uint32_t)size_buf[2] << 16) | ((uint32_t)size_buf[3] << 24);
            uint32_t height = (uint32_t)size_buf[4] | ((uint32_t)size_buf[5] << 8)
                            | ((uint32_t)size_buf[6] << 16) | ((uint32_t)size_buf[7] << 24);
            uint32_t pixels_len = payload_len - 8;

            std::vector<uint8_t> pixels(pixels_len);
            if (!read_exact(pixels.data(), pixels_len)) break;

            // BGRA → RGBA swap
            for (uint32_t i = 0; i + 3 < pixels_len; i += 4) {
                uint8_t b = pixels[i];
                pixels[i] = pixels[i + 2];
                pixels[i + 2] = b;
            }

            vr::VROverlay()->SetOverlayRaw(mainHandle, pixels.data(), width, height, 4);
        } else if (msg_type == 0x06 && payload_len == 4) {
            // SET_WIDTH
            uint8_t fbuf[4];
            if (!read_exact(fbuf, 4)) break;
            float meters;
            memcpy(&meters, fbuf, 4);
            if (meters >= 0.5f && meters <= 8.0f) {
                vr::VROverlay()->SetOverlayWidthInMeters(mainHandle, meters);
            }
        } else {
            // Unknown message type — drain the payload
            std::vector<uint8_t> drain(payload_len);
            if (!read_exact(drain.data(), payload_len)) break;
        }
    }

    g_running.store(false);
    poller.join();
    vr::VR_Shutdown();
    return 0;
}
