// Loads Razorpay Checkout on demand and resolves with the payment details the
// backend needs to verify. Rejects if the window is closed or payment fails.
declare global { interface Window { Razorpay?: any } }

const loadScript = () =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No browser"));
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load the payment window. Check your internet and try again."));
    document.body.appendChild(s);
  });

export interface Paid { orderId: string; paymentId: string; signature: string; }

export async function payWithRazorpay(opts: { keyId: string; orderId: string; amount: number; description: string; prefill?: { name?: string; email?: string; contact?: string } }): Promise<Paid> {
  await loadScript();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: opts.keyId,
      order_id: opts.orderId,
      amount: opts.amount,
      currency: "INR",
      name: "YNeet",
      description: opts.description,
      prefill: opts.prefill,
      theme: { color: "#14213D" },
      handler: (r: any) => resolve({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
      modal: { ondismiss: () => reject(new Error("cancelled")) },
    });
    rzp.on("payment.failed", (r: any) => reject(new Error(r?.error?.description || "Payment failed")));
    rzp.open();
  });
}

export const trackPurchase = (value: number, item: string) => {
  try { (window as any).gtag?.("event", "purchase", { value, currency: "INR", items: [{ item_name: item }], transport_type: "beacon" }); } catch { /* analytics only */ }
};
