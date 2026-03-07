import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Loader2, X, PawPrint } from 'lucide-react';

interface CloudinarySignature {
  timestamp: number;
  signature: string;
  folder:    string;
  apiKey:    string;
  cloudName: string;
}

interface CloudinaryUploadResult {
  secure_url: string;
  public_id:  string;
}

const uploadToCloudinary = async (file: File, sig: CloudinarySignature): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  formData.append('file',      file);
  formData.append('api_key',   sig.apiKey);
  formData.append('timestamp', String(sig.timestamp));
  formData.append('signature', sig.signature);
  formData.append('folder',    sig.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: 'POST',
    body:   formData,
  });

  if (!res.ok) throw new Error('Image upload failed');
  return res.json();
};

export default function ReportPet() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', type: '', breed: '', color: '',
    gender: 'UNKNOWN', age: '', wellness: '', status: 'LOST',
    incidentDate: '', state: '', city: '', village: '',
    addressLine: '', pincode: '', googleMapsLink: '', birthmark: '',
  });

  const [imageFile,      setImageFile]      = useState<File | null>(null);
  const [imagePreview,   setImagePreview]   = useState<string | null>(null);
  const [uploadedUrl,    setUploadedUrl]    = useState<string | null>(null);
  const [uploadedPubId,  setUploadedPubId]  = useState<string | null>(null);
  const [uploading,      setUploading]      = useState(false);
  const [submitting,     setSubmitting]     = useState(false);

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadedUrl(null);
    setUploadedPubId(null);
  };

  const handleUpload = async () => {
    if (!imageFile) return;
    setUploading(true);
    try {
      const sig = await apiFetch<CloudinarySignature>('/api/pets/upload-signature');
      const result = await uploadToCloudinary(imageFile, sig);
      setUploadedUrl(result.secure_url);
      setUploadedPubId(result.public_id);
      toast.success('Image uploaded! ✅');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type.trim()) { toast.error('Pet type is required'); return; }
    if (!form.state.trim() || !form.city.trim()) { toast.error('State and City are required'); return; }

    setSubmitting(true);
    try {
      await apiFetch('/api/pets', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          age:           form.age ? parseInt(form.age) : undefined,
          incidentDate:  form.incidentDate ? new Date(form.incidentDate).toISOString() : undefined,
          imageUrl:      uploadedUrl      ?? undefined,
          imagePublicId: uploadedPubId    ?? undefined,
          googleMapsLink: form.googleMapsLink || undefined,
        }),
      });
      toast.success('Pet reported successfully! 🐾 Pending admin approval.');
      navigate('/profile');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to report pet');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-8 mb-16">
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Report a Pet</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Help reunite pets with their families</p>
          </CardHeader>

          <CardContent className="pt-2">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Basic Info */}
              <Section title="Basic Information">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Pet Name">
                    <Input placeholder="Bruno" value={form.name} onChange={set('name')} />
                  </Field>
                  <Field label="Type *">
                    <Input placeholder="Dog, Cat, Bird..." value={form.type} onChange={set('type')} required />
                  </Field>
                  <Field label="Breed">
                    <Input placeholder="Labrador" value={form.breed} onChange={set('breed')} />
                  </Field>
                  <Field label="Color">
                    <Input placeholder="Golden" value={form.color} onChange={set('color')} />
                  </Field>
                  <Field label="Gender">
                    <select value={form.gender} onChange={set('gender')} className={selectCls}>
                      <option value="UNKNOWN">Unknown</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </Field>
                  <Field label="Age (years)">
                    <Input type="number" placeholder="3" value={form.age} onChange={set('age')} min={0} />
                  </Field>
                  <Field label="Wellness">
                    <Input placeholder="Healthy, Injured..." value={form.wellness} onChange={set('wellness')} />
                  </Field>
                  <Field label="Status">
                    <div className="flex gap-4 pt-1">
                      {(['LOST', 'FOUND'] as const).map(s => (
                        <label key={s} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio" name="status" value={s}
                            checked={form.status === s}
                            onChange={set('status')}
                            className="accent-indigo-600"
                          />
                          <span className="text-sm font-medium">{s}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>
                <Field label="Date Lost / Found">
                  <Input type="date" value={form.incidentDate} onChange={set('incidentDate')} />
                </Field>
              </Section>

              {/* Location */}
              <Section title="Location">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="State *">
                    <Input placeholder="Maharashtra" value={form.state} onChange={set('state')} required />
                  </Field>
                  <Field label="City *">
                    <Input placeholder="Pune" value={form.city} onChange={set('city')} required />
                  </Field>
                  <Field label="Village">
                    <Input placeholder="Kothrud" value={form.village} onChange={set('village')} />
                  </Field>
                  <Field label="Pincode">
                    <Input placeholder="411004" value={form.pincode} onChange={set('pincode')} />
                  </Field>
                </div>
                <Field label="Address Line">
                  <Input placeholder="Near D-Mart, FC Road" value={form.addressLine} onChange={set('addressLine')} />
                </Field>
                <Field label="Google Maps Link">
                  <Input placeholder="https://maps.google.com/..." value={form.googleMapsLink} onChange={set('googleMapsLink')} />
                </Field>
              </Section>

              {/* Other */}
              <Section title="Additional Details">
                <Field label="Birthmark / Identifying Features">
                  <textarea
                    value={form.birthmark}
                    onChange={set('birthmark')}
                    rows={2}
                    placeholder="White patch on left ear, scar on right paw..."
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
              </Section>

              {/* Image Upload */}
              <Section title="Pet Photo">
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); setUploadedUrl(null); }}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                      {!uploadedUrl && (
                        <Button
                          type="button"
                          onClick={handleUpload}
                          disabled={uploading}
                          className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          {uploading
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                            : <><Upload className="w-4 h-4 mr-2" /> Upload to Cloudinary</>
                          }
                        </Button>
                      )}
                      {uploadedUrl && (
                        <p className="text-center text-sm text-green-600 mt-2 font-medium">✅ Image uploaded</p>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 transition">
                      <Upload className="w-8 h-8 text-gray-300 mb-2" />
                      <span className="text-sm text-gray-500">Click to select image</span>
                      <span className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 5MB</span>
                      <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    </label>
                  )}
                </div>
              </Section>

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-5 text-base font-semibold"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  : '🐾 Submit Report'
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

// ── Small helper components ───────────────────────────────────────────────────
const selectCls = 'w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {children}
  </div>
);