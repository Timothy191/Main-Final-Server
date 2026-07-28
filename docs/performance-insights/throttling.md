# Throttling

![Sofia Emelianova](https://web.dev/images/authors/sofiayem.jpg) Sofia Emelianova [GitHub](https://github.com/sofiayem)

<br />

In ![Settings.](https://developer.chrome.com/static/docs/devtools/settings/throttling/image/settings-02e5a7fffbc4f.svg) [**Settings**](https://developer.chrome.com/docs/devtools/settings#open) \> **Throttling**, you can:

- Calibrate CPU throttling presets to approximate the typical performance of low- and mid-tier mobile devices.
- Set up custom throttling profiles. You can use these profiles to test [custom connection speeds in the **Network** panel](https://developer.chrome.com/docs/devtools/network/reference#throttling-profile).

![The Throttling tab.](https://developer.chrome.com/static/docs/devtools/settings/throttling/image/setting-throttling.png)

## Calibrate CPU throttling presets

To calibrate CPU throttling presets:

1. [Open Settings](https://developer.chrome.com/docs/devtools/settings#open).
2. In the **Throttling** \> **CPU throttling presets** , click **Calibrate** and **Continue**.
3. Wait about 5 seconds for DevTools to navigate away from your current page and reload it.

The **Throttling** tab will show the CPU throttling rates that you can apply to your device to get an idea of how your page performs on low- and mid-tier mobile devices.

![Calibrated rates next for low- and mid-tier mobile devices.](https://developer.chrome.com/static/docs/devtools/settings/throttling/image/calibrated.png)

With presets calibrated, you can find them in **Performance** \> **Environment settings** \> **CPU** and in **Performance** \> **Capture settings** drop-down menus.

![Calibrated rates next in drop-down menus in the Performance panel.](https://developer.chrome.com/static/docs/devtools/settings/throttling/image/calibrated-presets.png)

## Set up custom network throttling profile

To add a custom network throttling profile:

1. [Open Settings](https://developer.chrome.com/docs/devtools/settings#open).
2. In **Throttling** \> **Network throttling profiles** , click **Add profile**.
3. Specify the following optional parameter values for the new entry:

   ![Creating a new profile in the Throttling tab.](https://developer.chrome.com/static/docs/devtools/settings/throttling/image/custom-profile.png)
   - **Profile Name**.
   - **Download** and **Upload** speeds in Kbps.
   - **Latency** in milliseconds.

   Packed-related parameters:
   - **Packer loss** in percent.
   - **Packet queue length** as a number.
   - **Packet reordering** flag, on or off.

   > [!NOTE]
   > **Note:** With packet-related parameters, you can throttle [WebRTC](https://webrtc.org/) applications without using third-party software. You can try these parameters in this [demo page](https://webrtc.github.io/samples/src/content/peerconnection/pc1/).

4. Click **Add** to save the new profile. You can now select it from the [throttling drop-down list in the **Network** panel](https://developer.chrome.com/docs/devtools/network/reference#throttling-profile).

To edit or remove an existing profile, click ![Edit.](https://developer.chrome.com/static/docs/devtools/settings/throttling/image/edit-e0621e082d5a6.svg) or ![Delete.](https://developer.chrome.com/static/docs/devtools/settings/throttling/image/delete-79366e584d71.svg) buttons that appear on hover.
