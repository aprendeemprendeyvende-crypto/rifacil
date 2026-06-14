"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Plus, X, Loader2, Trash2, Pencil, Search } from "lucide-react";

type RoleFilter = "ALL" | "VENDEDOR" | "ADMIN";

type VendorForm = {
  name: string;
  lastName?: string;
  idDocument?: string;
  phone: string;
  email?: string;
  role: "VENDEDOR" | "ADMIN";
  commissionRate?: string;
};

const ROLE_LABELS: Record<string, string> = { VENDEDOR: "Vendedor", ADMIN: "Admin" };
const ROLE_BADGE: Record<string, string> = {
  VENDEDOR: "bg-slate-100 text-slate-600",
  ADMIN: "bg-violet-100 text-violet-700",
};

export default function VendorsPage() {
  const utils = api.useContext();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [modalVendor, setModalVendor] = useState<any | null | undefined>(undefined); // undefined=cerrado, null=crear, obj=editar

  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = api.vendor.list.useQuery({
    role: roleFilter,
    search: search || undefined,
  });

  const toggleActive = api.vendor.update.useMutation({
    onSuccess: () => utils.vendor.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const deleteVendor = api.vendor.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuario eliminado");
      utils.vendor.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const vendors = data?.vendors ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <button
          onClick={() => setModalVendor(null)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" /> Crear usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(["ALL", "VENDEDOR", "ADMIN"] as RoleFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                roleFilter === r
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {r === "ALL" ? "Todos" : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, cédula…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-slate-900"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : vendors.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-10 text-center text-slate-500">
          <p className="font-medium text-slate-700">No hay usuarios</p>
          <p className="mt-1 text-sm">Crea tu primer usuario para repartir números y llevar el recaudo.</p>
        </div>
      ) : (
        <>
          {/* Tabla (desktop) */}
          <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Apellido</th>
                  <th className="px-4 py-3">Identificación</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Comisión</th>
                  <th className="px-4 py-3">Actividad</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vendors.map((v: any) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{v.name}</td>
                    <td className="px-4 py-3 text-slate-600">{v.lastName || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{v.idDocument || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{v.phone}</td>
                    <td className="px-4 py-3 text-slate-600">{v.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[v.role] ?? ROLE_BADGE.VENDEDOR}`}>
                        {ROLE_LABELS[v.role] ?? v.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{Number(v.commissionRate)}%</td>
                    <td className="px-4 py-3">
                      <ActivityToggle
                        active={v.active}
                        disabled={toggleActive.isLoading}
                        onToggle={() => toggleActive.mutate({ id: v.id, data: { active: !v.active } })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconBtn label="Editar" onClick={() => setModalVendor(v)}>
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn
                          label="Eliminar"
                          danger
                          onClick={() => {
                            if (confirm(`¿Eliminar a ${v.name}?`)) deleteVendor.mutate({ id: v.id });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (mobile) */}
          <div className="space-y-3 md:hidden">
            {vendors.map((v: any) => (
              <div key={v.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {v.name} {v.lastName || ""}
                    </p>
                    <p className="text-sm text-slate-500">{v.phone}</p>
                    {v.idDocument && <p className="text-sm text-slate-500">ID: {v.idDocument}</p>}
                    {v.email && <p className="truncate text-sm text-slate-500">{v.email}</p>}
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[v.role] ?? ROLE_BADGE.VENDEDOR}`}>
                        {ROLE_LABELS[v.role] ?? v.role}
                      </span>
                      <span>Comisión {Number(v.commissionRate)}%</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <ActivityToggle
                      active={v.active}
                      disabled={toggleActive.isLoading}
                      onToggle={() => toggleActive.mutate({ id: v.id, data: { active: !v.active } })}
                    />
                    <div className="flex gap-1">
                      <IconBtn label="Editar" onClick={() => setModalVendor(v)}>
                        <Pencil className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn
                        label="Eliminar"
                        danger
                        onClick={() => {
                          if (confirm(`¿Eliminar a ${v.name}?`)) deleteVendor.mutate({ id: v.id });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconBtn>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modalVendor !== undefined && (
        <VendorModal
          vendor={modalVendor}
          onClose={() => setModalVendor(undefined)}
          onSaved={() => {
            setModalVendor(undefined);
            utils.vendor.list.invalidate();
          }}
        />
      )}
    </div>
  );
}

function ActivityToggle({
  active,
  disabled,
  onToggle,
}: {
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="inline-flex items-center gap-2 disabled:opacity-50"
      title={active ? "Activo (toca para desactivar)" : "Inactivo (toca para activar)"}
    >
      <span className="relative inline-block h-6 w-11 shrink-0">
        <span className={`block h-6 w-11 rounded-full transition ${active ? "bg-green-500" : "bg-slate-300"}`} />
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${active ? "left-[22px]" : "left-0.5"}`} />
      </span>
      <span className={`text-xs font-medium ${active ? "text-green-600" : "text-slate-400"}`}>
        {active ? "Activo" : "Inactivo"}
      </span>
    </button>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-lg p-2 hover:bg-slate-100 ${
        danger ? "text-slate-400 hover:text-red-600" : "text-slate-400 hover:text-blue-600"
      }`}
    >
      {children}
    </button>
  );
}

function VendorModal({
  vendor,
  onClose,
  onSaved,
}: {
  vendor: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!vendor;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorForm>({
    defaultValues: {
      name: vendor?.name ?? "",
      lastName: vendor?.lastName ?? "",
      idDocument: vendor?.idDocument ?? "",
      phone: vendor?.phone ?? "",
      email: vendor?.email ?? "",
      role: (vendor?.role as "VENDEDOR" | "ADMIN") ?? "VENDEDOR",
      commissionRate: vendor ? String(Number(vendor.commissionRate)) : "",
    },
  });

  const create = api.vendor.create.useMutation({
    onSuccess: () => {
      toast.success("Usuario creado");
      onSaved();
    },
    onError: (e) => toast.error(e.message),
  });
  const update = api.vendor.update.useMutation({
    onSuccess: () => {
      toast.success("Usuario actualizado");
      onSaved();
    },
    onError: (e) => toast.error(e.message),
  });

  const busy = create.isLoading || update.isLoading;

  const onSubmit = (form: VendorForm) => {
    const commission = form.commissionRate ? Number(form.commissionRate) : 0;
    if (commission < 0 || commission > 100) {
      toast.error("La comisión debe estar entre 0 y 100");
      return;
    }
    if (isEdit) {
      update.mutate({
        id: vendor.id,
        data: {
          name: form.name,
          lastName: form.lastName || null,
          idDocument: form.idDocument || null,
          phone: form.phone,
          email: form.email || null,
          role: form.role,
          commissionRate: commission,
        },
      });
    } else {
      create.mutate({
        name: form.name,
        lastName: form.lastName || undefined,
        idDocument: form.idDocument || undefined,
        phone: form.phone,
        email: form.email || undefined,
        role: form.role,
        commissionRate: commission,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border bg-white p-6 sm:max-w-md sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Editar usuario" : "Crear usuario"}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre" error={errors.name?.message}>
              <input
                {...register("name", { required: "El nombre es obligatorio", minLength: { value: 2, message: "Mínimo 2 caracteres" } })}
                className={inputCls}
                placeholder="Ej: María"
              />
            </Field>
            <Field label="Apellido">
              <input {...register("lastName")} className={inputCls} placeholder="Ej: Pérez" />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Cédula / Identificación">
              <input {...register("idDocument")} className={inputCls} placeholder="V-12.345.678" />
            </Field>
            <Field label="Teléfono" error={errors.phone?.message}>
              <input
                {...register("phone", { required: "El teléfono es obligatorio" })}
                className={inputCls}
                placeholder="0424 123 4567"
                inputMode="tel"
              />
            </Field>
          </div>

          <Field label="Correo (opcional)">
            <input type="email" {...register("email")} className={inputCls} placeholder="maria@correo.com" />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Rol">
              <select {...register("role")} className={inputCls}>
                <option value="VENDEDOR">Vendedor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </Field>
            <Field label="Comisión % por venta">
              <input type="number" step="0.1" min="0" max="100" {...register("commissionRate")} className={inputCls} placeholder="10" />
            </Field>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : isEdit ? "Guardar cambios" : "Crear usuario"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
