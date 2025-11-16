const applicationServerKey = urlBase64ToUint8Array(
  'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk'
);

async function subscribeUser() {
  try {
    // Minta perizinan notifikasi
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("Notification permission is required!");
      return;
    }

    const swRegistration = await navigator.serviceWorker.ready;

    // Daftarkan push subscription
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log("Subscribed:", subscription);

    // Ambil token login Dicoding
    const token = sessionStorage.getItem("authToken");

    // SIMPAN SUBSCRIPTION KE SERVER DICODING
    await fetch("https://story-api.dicoding.dev/v1/notifications/subscribe", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
          auth: arrayBufferToBase64(subscription.getKey("auth")),
        },
      }),
    });

    console.log("Subscription saved to Dicoding server");

    return subscription;

  } catch (err) {
    console.error("Subscribe failed:", err);
    alert("Failed to subscribe: " + err);
  }
}

function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

async function unsubscribeUser() {
  const swRegistration = await navigator.serviceWorker.ready;
  const subscription = await swRegistration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
    console.log('Unsubscribed');
  }
}


function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export { subscribeUser, unsubscribeUser };

