import mongoose from "mongoose";

// Small key/value switches the admin can flip from the dashboard
// (e.g. "signupFollowup" → { enabled: true }).
const appSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const AppSetting = mongoose.model("AppSetting", appSettingSchema);

export async function getSetting(key, fallback = {}) {
  const row = await AppSetting.findOne({ key }).lean();
  return { ...fallback, ...(row?.value || {}) };
}

export async function setSetting(key, value) {
  const row = await AppSetting.findOneAndUpdate({ key }, { $set: { value } }, { upsert: true, new: true }).lean();
  return row.value;
}

export default AppSetting;
