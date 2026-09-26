"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[7641],
	{
		16776: (e, t, a) => {
			a.d(t, { w: () => o });
			var s = a(95155),
				r = a(39658),
				n = a(79792),
				i = a(26518),
				l = a(88361);
			function o({
				label: e,
				mode: t,
				onModeChange: a,
				value: d,
				onValueChange: c,
				subtotal: m,
			}) {
				let u = (0, l.mW)(t, d),
					p = (0, l.HW)(m, t, u);
				return (0, s.jsxs)("div", {
					className: "rounded-lg border bg-muted/30 p-4 space-y-3",
					children: [
						(0, s.jsxs)("p", {
							className: "text-sm font-medium",
							children: [e, " discount"],
						}),
						(0, s.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: [
								(0, s.jsxs)("div", {
									className: "space-y-2",
									children: [
										(0, s.jsx)(n.J, {
											className: "text-xs",
											children: "Type",
										}),
										(0, s.jsxs)(i.l6, {
											value: t,
											onValueChange: (e) => a(e),
											children: [
												(0, s.jsx)(i.bq, {
													children: (0, s.jsx)(i.yv, {}),
												}),
												(0, s.jsxs)(i.gC, {
													children: [
														(0, s.jsx)(i.eb, {
															value: "none",
															children: "No discount",
														}),
														(0, s.jsx)(i.eb, {
															value: "percentage",
															children: "Percentage (%)",
														}),
														(0, s.jsx)(i.eb, {
															value: "amount",
															children: "Amount",
														}),
													],
												}),
											],
										}),
									],
								}),
								"none" !== t &&
									(0, s.jsxs)("div", {
										className: "space-y-2",
										children: [
											(0, s.jsx)(n.J, {
												className: "text-xs",
												children:
													"percentage" === t
														? `Percent off ${e.toLowerCase()} total`
														: `Amount off ${e.toLowerCase()} total`,
											}),
											(0, s.jsx)(r.p, {
												type: "number",
												min: 0,
												max: "percentage" === t ? 100 : m || void 0,
												step: 0.01,
												value: d,
												onChange: (e) => c(e.target.value),
												placeholder:
													"percentage" === t ? "e.g. 15" : "e.g. 500",
											}),
										],
									}),
							],
						}),
						"none" !== t &&
							p > 0 &&
							(0, s.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children:
									"percentage" === t
										? `−${p.toLocaleString()} (${u}%) off ${e.toLowerCase()}`
										: `−${p.toLocaleString()} off ${e.toLowerCase()}`,
							}),
					],
				});
			}
		},
		21531: (e, t, a) => {
			a.d(t, {
				$2: () => n,
				GL: () => u,
				Kf: () => i,
				Mk: () => o,
				NU: () => h,
				Nr: () => p,
				_H: () => m,
				_L: () => l,
				hK: () => c,
				tP: () => d,
				yL: () => x,
			});
			var s = a(49876);
			let r = "dms.api.spare_part_sales";
			async function n(e) {
				return (0, s.AT)(`/api/method/${r}.get_spare_part_sales_defaults`, {
					method: "POST",
					body: JSON.stringify({ company: e || null }),
				});
			}
			async function i(e) {
				return (0, s.AT)(`/api/method/${r}.search_spare_parts_for_sale`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						warehouse: e?.warehouse || null,
						limit: e?.limit || 25,
						in_stock_only: +!!e?.inStockOnly,
					}),
				});
			}
			async function l(e) {
				return (0, s.AT)(`/api/method/${r}.create_spare_part_sale`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function o(e) {
				return (0, s.AT)(`/api/method/${r}.list_spare_part_proformas`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						status: e?.status || null,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
						from_date: e?.from_date || null,
						to_date: e?.to_date || null,
					}),
				});
			}
			async function d(e) {
				return (0, s.AT)(`/api/method/${r}.get_spare_part_proforma`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function c(e) {
				return (0, s.AT)(`/api/method/${r}.create_spare_part_proforma`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function m(e) {
				return (0, s.AT)(`/api/method/${r}.update_spare_part_proforma`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function u(e, t) {
				return (0, s.AT)(`/api/method/${r}.convert_proforma_to_sales_invoice`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t || {} }),
				});
			}
			async function p(e) {
				return (0, s.AT)(`/api/method/${r}.cancel_spare_part_proforma`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function h(e) {
				return (0, s.AT)(`/api/method/${r}.delete_draft_spare_part_proforma`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function x(e) {
				return (0, s.AT)(`/api/method/${r}.amend_spare_part_proforma`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
		},
		26518: (e, t, a) => {
			a.d(t, { bq: () => m, eb: () => p, gC: () => u, l6: () => d, yv: () => c });
			var s = a(95155);
			a(12115);
			var r = a(40287),
				n = a(66088),
				i = a(94514),
				l = a(9921),
				o = a(91337);
			function d({ ...e }) {
				return (0, s.jsx)(r.bL, { "data-slot": "select", ...e });
			}
			function c({ ...e }) {
				return (0, s.jsx)(r.WT, { "data-slot": "select-value", ...e });
			}
			function m({ className: e, size: t = "default", children: a, ...i }) {
				return (0, s.jsxs)(r.l9, {
					"data-slot": "select-trigger",
					"data-size": t,
					className: (0, o.cn)(
						"border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-full border bg-transparent px-4 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...i,
					children: [
						a,
						(0, s.jsx)(r.In, {
							asChild: !0,
							children: (0, s.jsx)(n.A, { className: "size-4 opacity-50" }),
						}),
					],
				});
			}
			function u({ className: e, children: t, position: a = "popper", ...n }) {
				return (0, s.jsx)(r.ZL, {
					children: (0, s.jsxs)(r.UC, {
						"data-slot": "select-content",
						className: (0, o.cn)(
							"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
							"popper" === a &&
								"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
							e
						),
						position: a,
						...n,
						children: [
							(0, s.jsx)(h, {}),
							(0, s.jsx)(r.LM, {
								className: (0, o.cn)(
									"p-1",
									"popper" === a &&
										"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
								),
								children: t,
							}),
							(0, s.jsx)(x, {}),
						],
					}),
				});
			}
			function p({ className: e, children: t, ...a }) {
				return (0, s.jsxs)(r.q7, {
					"data-slot": "select-item",
					className: (0, o.cn)(
						"focus:bg-dms-green-light focus:text-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
						e
					),
					...a,
					children: [
						(0, s.jsx)("span", {
							className:
								"absolute right-2 flex size-3.5 items-center justify-center",
							children: (0, s.jsx)(r.VF, {
								children: (0, s.jsx)(i.A, { className: "size-4" }),
							}),
						}),
						(0, s.jsx)(r.p4, { children: t }),
					],
				});
			}
			function h({ className: e, ...t }) {
				return (0, s.jsx)(r.PP, {
					"data-slot": "select-scroll-up-button",
					className: (0, o.cn)(
						"flex cursor-default items-center justify-center py-1",
						e
					),
					...t,
					children: (0, s.jsx)(l.A, { className: "size-4" }),
				});
			}
			function x({ className: e, ...t }) {
				return (0, s.jsx)(r.wn, {
					"data-slot": "select-scroll-down-button",
					className: (0, o.cn)(
						"flex cursor-default items-center justify-center py-1",
						e
					),
					...t,
					children: (0, s.jsx)(n.A, { className: "size-4" }),
				});
			}
		},
		42074: (e, t, a) => {
			a.d(t, { h: () => l });
			var s = a(95155),
				r = a(12115),
				n = a(47650),
				i = a(91337);
			function l({ children: e, className: t, align: a = "end" }) {
				let [o, d] = (0, r.useState)(!1);
				(0, r.useEffect)(() => (d(!0), () => d(!1)), []);
				let c = (0, s.jsx)("div", {
					role: "toolbar",
					"aria-label": "Form actions",
					className: (0, i.cn)(
						"fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_24px_rgba(15,61,94,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-card/90",
						"pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3",
						"lg:left-64",
						t
					),
					children: (0, s.jsx)("div", {
						className: (0, i.cn)(
							"mx-auto w-full max-w-[1600px] px-3 sm:px-4 lg:px-6",
							"between" === a
								? "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3"
								: "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3"
						),
						children: e,
					}),
				});
				return o ? (0, n.createPortal)(c, document.body) : null;
			}
		},
		52959: (e, t, a) => {
			a.d(t, { _: () => l });
			var s = a(95155),
				r = a(4474),
				n = a(51914),
				i = a(91337);
			function l({ onClick: e, label: t = "Add", className: a, disabled: o }) {
				return (0, s.jsx)("div", {
					className: (0, i.cn)("pt-1", a),
					children: (0, s.jsxs)(r.$, {
						type: "button",
						onClick: e,
						disabled: o,
						children: [(0, s.jsx)(n.A, { className: "h-4 w-4 mr-1" }), t],
					}),
				});
			}
		},
		57641: (e, t, a) => {
			a.r(t), a.d(t, { default: () => I });
			var s = a(95155),
				r = a(12115),
				n = a(90901),
				i = a(44855),
				l = a(66609),
				o = a(80723),
				d = a(68459),
				c = a(24642),
				m = a(6296),
				u = a(55243),
				p = a(32390),
				h = a(55833),
				x = a(36020),
				_ = a(10086),
				f = a(92751),
				g = a(15664),
				y = a(58496),
				v = a(42074),
				b = a(16776),
				j = a(89307),
				N = a(52959),
				w = a(4474),
				S = a(79984),
				T = a(84437),
				O = a(39658),
				C = a(79792),
				A = a(39540),
				$ = a(26518),
				k = a(88361),
				J = a(5240),
				L = a(65816),
				P = a(21531);
			function D() {
				return {
					id: crypto.randomUUID(),
					spare_part: "",
					item_name: "",
					display_name: "",
					qty: "1",
					unit_price: "",
				};
			}
			function z() {
				return {
					id: crypto.randomUUID(),
					vehicle_service_item: "",
					vehicle_service_item_name: "",
					display_name: "",
					hours: "1",
					rate_per_hour: "",
				};
			}
			function F() {
				return new Date().toISOString().split("T")[0];
			}
			function q() {
				let e = new Date();
				return e.setDate(e.getDate() + 30), e.toISOString().split("T")[0];
			}
			function M(e, t) {
				return new Intl.NumberFormat("en-US", {
					style: "currency",
					currency: t || "ETB",
					minimumFractionDigits: 2,
				}).format(e ?? 0);
			}
			function I() {
				let { viewParams: e, navigate: t } = (0, h.c)(),
					{ mutate: a } = (0, n.iX)(),
					I = (e.get("id") || "").trim(),
					[U, V] = (0, r.useState)(""),
					[W, E] = (0, r.useState)(""),
					[Z, B] = (0, r.useState)(""),
					[H, R] = (0, r.useState)(""),
					[K, X] = (0, r.useState)(F()),
					[G, Y] = (0, r.useState)(q()),
					[Q, ee] = (0, r.useState)(""),
					[et, ea] = (0, r.useState)(!1),
					[es, er] = (0, r.useState)(!1),
					[en, ei] = (0, r.useState)(!1),
					[el, eo] = (0, r.useState)([D()]),
					[ed, ec] = (0, r.useState)([z()]),
					[em, eu] = (0, r.useState)(""),
					[ep, eh] = (0, r.useState)(""),
					[ex, e_] = (0, r.useState)(!1),
					[ef, eg] = (0, r.useState)(!1),
					[ey, ev] = (0, r.useState)(0),
					[eb, ej] = (0, r.useState)(0),
					[eN, ew] = (0, r.useState)("none"),
					[eS, eT] = (0, r.useState)(""),
					[eO, eC] = (0, r.useState)("none"),
					[eA, e$] = (0, r.useState)(""),
					[ek, eJ] = (0, r.useState)(!1),
					[eL, eP] = (0, r.useState)(null),
					[eD, ez] = (0, r.useState)(!1),
					{ data: eF } = (0, i.Ay)("spare-part-sales-defaults", () => P.$2()),
					{ data: eq } = (0, i.Ay)(I ? ["dms-order", I] : null, () => L.Xs(I)),
					{ data: eM, isLoading: eI } = (0, i.Ay)(["order-customers", Z], () =>
						J.gn(Z || void 0, 20)
					),
					{ data: eU, isLoading: eV } = (0, x.Sg)(em),
					{ data: eW, isLoading: eE } = (0, i.Ay)(["order-parts", ep, H, et], () =>
						P.Kf({
							search: ep || void 0,
							warehouse: H || void 0,
							limit: 25,
							inStockOnly: et,
						})
					),
					eZ = (0, r.useMemo)(
						() =>
							(eM?.data || []).map((e) => ({
								value: e.name,
								label: e.customer_name || e.name,
							})),
						[eM]
					),
					eB = (0, r.useMemo)(
						() =>
							(eU || []).map((e) => ({
								value: e.name,
								label: (0, J.sJ)(e),
								description:
									e.custom_rate || e.estimated_hours
										? [
												e.custom_rate ? `Rate: ${e.custom_rate}` : null,
												e.estimated_hours ? `${e.estimated_hours}h` : null,
										  ]
												.filter(Boolean)
												.join(" \xb7 ")
										: void 0,
							})),
						[eU]
					),
					eH = (0, r.useMemo)(
						() =>
							(eW || []).map((e) => ({
								value: e.name,
								label: e.item_name || e.name,
								description: [
									e.item_code || e.name,
									null != e.unit_price ? String(e.unit_price) : null,
									null != e.qty_on_hand ? `stock ${e.qty_on_hand}` : null,
								]
									.filter(Boolean)
									.join(" \xb7 "),
							})),
						[eW]
					),
					eR = eF?.warehouses || [],
					eK = eq?.currency || "ETB",
					eX = el.reduce(
						(e, t) => e + (Number(t.qty) || 0) * (Number(t.unit_price) || 0),
						0
					),
					eG = ed.reduce(
						(e, t) => e + (Number(t.hours) || 0) * (Number(t.rate_per_hour) || 0),
						0
					),
					eY = (0, k.mW)(eO, eA),
					eQ = (0, k.HW)(eX, eO, eY),
					e0 = (0, k.mW)(eN, eS),
					e1 = (0, k.HW)(eG, eN, e0),
					e2 = eG - e1 + eX - eQ,
					e5 = (0, r.useMemo)(
						() => ({
							parts: el
								.filter((e) => e.spare_part && Number(e.qty) > 0)
								.map((e) => ({
									spare_part: e.spare_part,
									qty: Number(e.qty),
									unit_price: Number(e.unit_price || 0),
									description: e.display_name.trim() || void 0,
								})),
							labour: ed
								.filter((e) => e.vehicle_service_item && Number(e.hours) > 0)
								.map((e) => ({
									vehicle_service_item: e.vehicle_service_item,
									hours: Number(e.hours),
									rate_per_hour: Number(e.rate_per_hour || 0),
									description: e.display_name.trim() || void 0,
								})),
						}),
						[el, ed]
					),
					e4 = (0, r.useMemo)(() => (0, k.Z_)(eN, eS), [eN, eS]),
					e3 = (0, r.useMemo)(() => (0, k.Z_)(eO, eA), [eO, eA]);
				(0, r.useEffect)(() => {
					if (
						!(
							U &&
							(e5.parts.length > 0 || e5.labour.length > 0) &&
							(0 === e5.parts.length || H)
						) ||
						(!es && !en)
					)
						return void eP(null);
					let e = !1,
						t = setTimeout(() => {
							ez(!0),
								L.m3({
									customer: U,
									company: eF?.company,
									warehouse: H || void 0,
									currency: eK,
									transaction_date: K,
									delivery_date: G,
									apply_taxes: es,
									apply_tax_withholding: en,
									parts: e5.parts,
									labour: e5.labour,
									labour_discount: e4 || null,
									parts_discount: e3 || null,
								})
									.then((t) => {
										e || eP(t);
									})
									.catch(() => {
										e || eP(null);
									})
									.finally(() => {
										e || ez(!1);
									});
						}, 300);
					return () => {
						(e = !0), clearTimeout(t);
					};
				}, [U, H, K, G, eK, es, en, eF?.company, e5, e4, e3]),
					(0, r.useEffect)(() => {
						!I &&
							eF &&
							(R((e) => e || eF.default_warehouse || ""),
							eF.default_customer &&
								(V((e) => e || eF.default_customer || ""),
								E(eF.default_customer_name || eF.default_customer)));
					}, [eF, I]),
					(0, r.useEffect)(() => {
						eq &&
							(V(eq.customer || ""),
							E(eq.customer_name || eq.customer || ""),
							R(eq.warehouse || ""),
							X(eq.transaction_date || F()),
							Y(eq.delivery_date || q()),
							ee(eq.remarks || ""),
							er(!!eq.apply_taxes || Number(eq.total_taxes_and_charges) > 0),
							ei(!!eq.apply_tax_withholding),
							eo(
								(eq.parts || []).length
									? (eq.parts || []).map((e) => ({
											id: crypto.randomUUID(),
											spare_part: e.spare_part || e.item_code || "",
											item_name: e.item_name || "",
											display_name: e.description || "",
											qty: String(e.qty ?? 1),
											unit_price: String(e.rate ?? ""),
									  }))
									: [D()]
							),
							ec(
								(eq.labour || []).length
									? (eq.labour || []).map((e) => ({
											id: crypto.randomUUID(),
											vehicle_service_item: e.vehicle_service_item || "",
											vehicle_service_item_name:
												e.vehicle_service_item_name || "",
											display_name: e.description || "",
											hours: String(e.hours ?? 1),
											rate_per_hour: String(e.rate_per_hour ?? ""),
									  }))
									: [z()]
							));
					}, [eq]);
				let e9 = async (e, t) => {
						if (!t)
							return void ec((t) =>
								t.map((t) =>
									t.id === e
										? {
												...t,
												vehicle_service_item: "",
												vehicle_service_item_name: "",
												display_name: "",
												hours: "1",
												rate_per_hour: "",
										  }
										: t
								)
							);
						let a = eU?.find((e) => e.name === t),
							s = Number(a?.custom_rate) || 0,
							r = (0, J.mW)(a),
							n = (0, J.sJ)(a) || t;
						try {
							let e = await (0, J.J$)(t);
							e.estimated_hours > 0 && (r = e.estimated_hours),
								e.rate_per_hour > 0 && (s = e.rate_per_hour),
								(e.service_name || e.service_code) &&
									(n = e.service_code
										? `${e.service_code}: ${e.service_name || t}`
										: e.service_name || n);
						} catch {
							if (!s)
								try {
									s = await (0, J.Mo)(t);
								} catch {}
						}
						ec((a) =>
							a.map((a) =>
								a.id === e
									? {
											...a,
											vehicle_service_item: t,
											vehicle_service_item_name: n,
											display_name: n,
											hours: String(r || 1),
											rate_per_hour: s ? String(s) : a.rate_per_hour,
									  }
									: a
							)
						);
					},
					e6 = async (e, t, a) => {
						if (!t)
							return void eo((t) =>
								t.map((t) =>
									t.id === e
										? {
												...t,
												spare_part: "",
												item_name: "",
												display_name: "",
												unit_price: "",
										  }
										: t
								)
							);
						let s = (eW || []).find((e) => e.name === t),
							r = Number(s?.unit_price) || 0,
							n = a || s?.item_name || "";
						eo((a) =>
							a.map((a) =>
								a.id === e
									? {
											...a,
											spare_part: t,
											item_name: n,
											display_name: a.display_name || n,
											unit_price: r ? String(r) : a.unit_price,
									  }
									: a
							)
						);
					},
					e7 = async (e) => {
						let a = "draft" === e,
							s = e5.parts,
							r = e5.labour;
						if (!s.length && !r.length)
							return void l.o.error(
								a
									? "Add at least one labour or item line before saving a draft"
									: "Add at least one labour or item line"
							);
						if (s.length && !H)
							return void l.o.error("Select a warehouse for spare parts");
						let n = {
							name: I || void 0,
							customer: U || void 0,
							company: eF?.company,
							warehouse: H || void 0,
							transaction_date: K,
							delivery_date: G,
							remarks: Q || void 0,
							apply_taxes: es,
							apply_tax_withholding: en,
							submit: +!a,
							parts: s,
							labour: r,
							labour_discount: e4,
							parts_discount: e3,
						};
						eJ(!0);
						try {
							let e = I ? await L.Yh(n) : await L.Fi(n);
							l.o.success(
								a
									? `Order ${e.name} saved as draft`
									: `Order ${e.name} submitted — ${M(e.grand_total, eK)}`
							),
								t("orders", { name: e.name });
						} catch (e) {
							l.o.error(e instanceof Error ? e.message : "Failed to save the order");
						} finally {
							eJ(!1);
						}
					},
					e8 = async (e) => {
						e.preventDefault(), await e7("create");
					};
				return (0, s.jsxs)("div", {
					className: "min-w-0 space-y-4 sm:space-y-6",
					children: [
						(0, s.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [
								(0, s.jsx)(w.$, {
									variant: "ghost",
									size: "icon",
									onClick: () => t("orders"),
									"aria-label": "Back to orders",
									children: (0, s.jsx)(o.A, { className: "h-5 w-5" }),
								}),
								(0, s.jsxs)("div", {
									className: "min-w-0",
									children: [
										(0, s.jsx)("h1", {
											className: "text-2xl font-bold text-foreground",
											children: I ? `Edit Order ${I}` : "New Order",
										}),
										(0, s.jsx)("p", {
											className: "mt-1 text-muted-foreground",
											children:
												"Order labour and parts that are not in stock — take a payment now, invoice later",
										}),
									],
								}),
							],
						}),
						(0, s.jsxs)("form", {
							id: "new-order-form",
							onSubmit: e8,
							className: "dms-form-page min-w-0 space-y-4 sm:space-y-6",
							children: [
								(0, s.jsxs)(S.Zp, {
									children: [
										(0, s.jsx)(S.aR, {
											children: (0, s.jsx)(S.ZB, {
												className: "text-base",
												children: "Order details",
											}),
										}),
										(0, s.jsxs)(S.Wu, {
											className: "grid gap-4 md:grid-cols-2",
											children: [
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsxs)(C.J, {
															children: [
																"Customer ",
																(0, s.jsx)("span", {
																	className: "text-destructive",
																	children: "*",
																}),
															],
														}),
														(0, s.jsx)(f.Z, {
															doctype: "Customer",
															onCreated: (e, t) => {
																V(e),
																	E(t || e),
																	a(
																		(e) =>
																			Array.isArray(e) &&
																			"order-customers" ===
																				e[0],
																		void 0,
																		{ revalidate: !0 }
																	);
															},
															children: (0, s.jsx)(_.Zi, {
																options: eZ,
																value: U,
																valueLabel: W,
																onValueChange: (e) => {
																	V(e),
																		E(
																			eZ.find(
																				(t) =>
																					t.value === e
																			)?.label || ""
																		);
																},
																onSearchChange: B,
																placeholder: "Search customers...",
																isLoading: eI,
																portaled: !0,
															}),
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(C.J, { children: "Warehouse" }),
														(0, s.jsxs)($.l6, {
															value: H || void 0,
															onValueChange: R,
															children: [
																(0, s.jsx)($.bq, {
																	children: (0, s.jsx)($.yv, {
																		placeholder:
																			"Select warehouse…",
																	}),
																}),
																(0, s.jsx)($.gC, {
																	children: eR.map((e) =>
																		(0, s.jsx)(
																			$.eb,
																			{
																				value: e.name,
																				children: e.name,
																			},
																			e.name
																		)
																	),
																}),
															],
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(C.J, {
															children: "Order date",
														}),
														(0, s.jsx)(O.p, {
															type: "date",
															value: K,
															onChange: (e) => X(e.target.value),
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(C.J, {
															children: "Expected delivery",
														}),
														(0, s.jsx)(O.p, {
															type: "date",
															value: G,
															onChange: (e) => Y(e.target.value),
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className:
														"flex items-center gap-2 md:col-span-2",
													children: [
														(0, s.jsx)(T.S, {
															id: "order-in-stock-only",
															checked: et,
															onCheckedChange: (e) => ea(!!e),
														}),
														(0, s.jsx)(C.J, {
															htmlFor: "order-in-stock-only",
															className:
																"cursor-pointer text-sm font-normal",
															children:
																"Show only parts in stock at the selected warehouse",
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "space-y-1 md:col-span-2",
													children: [
														(0, s.jsxs)("div", {
															className: "flex items-center gap-2",
															children: [
																(0, s.jsx)(T.S, {
																	id: "order-apply-taxes",
																	checked: es,
																	onCheckedChange: (e) =>
																		er(!!e),
																}),
																(0, s.jsx)(C.J, {
																	htmlFor: "order-apply-taxes",
																	className:
																		"cursor-pointer font-normal",
																	children: "Include VAT",
																}),
															],
														}),
														(0, s.jsx)("p", {
															className:
																"pl-6 text-xs text-muted-foreground",
															children:
																"Uses the Default Taxes and Charges Template from DMS Settings. Leave unchecked to place the order without VAT.",
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "space-y-1 md:col-span-2",
													children: [
														(0, s.jsxs)("div", {
															className: "flex items-center gap-2",
															children: [
																(0, s.jsx)(T.S, {
																	id: "order-apply-tax-withholding",
																	checked: en,
																	onCheckedChange: (e) =>
																		ei(!!e),
																}),
																(0, s.jsx)(C.J, {
																	htmlFor:
																		"order-apply-tax-withholding",
																	className:
																		"cursor-pointer font-normal",
																	children:
																		"Include tax withholding (TCS)",
																}),
															],
														}),
														(0, s.jsx)("p", {
															className:
																"pl-6 text-xs text-muted-foreground",
															children:
																"Stored on the order and applied when its invoice is raised — ERPNext withholds tax only on sales invoices. Uses the Default Tax Withholding Category from DMS Settings.",
														}),
													],
												}),
											],
										}),
									],
								}),
								(0, s.jsxs)(S.Zp, {
									children: [
										(0, s.jsx)(S.aR, {
											children: (0, s.jsx)(S.ZB, {
												className: "text-base",
												children: "Order lines",
											}),
										}),
										(0, s.jsxs)(S.Wu, {
											className: "space-y-6",
											children: [
												(0, s.jsxs)("div", {
													className: "space-y-3",
													children: [
														(0, s.jsx)(C.J, { children: "Labour" }),
														ed.map((e) =>
															(0, s.jsxs)(
																"div",
																{
																	className:
																		"grid gap-3 md:grid-cols-12 items-end border rounded-lg p-3",
																	children: [
																		(0, s.jsxs)("div", {
																			className:
																				"md:col-span-5 space-y-2",
																			children: [
																				(0, s.jsx)(C.J, {
																					className:
																						"text-xs",
																					children:
																						"Service item *",
																				}),
																				(0, s.jsx)(_.Zi, {
																					options: eB,
																					value: e.vehicle_service_item,
																					valueLabel:
																						e.vehicle_service_item_name ||
																						void 0,
																					onValueChange:
																						(t) =>
																							void e9(
																								e.id,
																								t
																							),
																					onSearchChange:
																						eu,
																					placeholder:
																						"Search service item",
																					isLoading: eV,
																					portaled: !0,
																					onCreateNew:
																						() => {
																							ev(
																								ed.indexOf(
																									e
																								)
																							),
																								eg(
																									!0
																								);
																						},
																					createNewLabel:
																						"New Service Item",
																				}),
																			],
																		}),
																		(0, s.jsxs)("div", {
																			className:
																				"md:col-span-2 space-y-2",
																			children: [
																				(0, s.jsx)(C.J, {
																					className:
																						"text-xs",
																					children:
																						"Hours *",
																				}),
																				(0, s.jsx)(O.p, {
																					type: "number",
																					min: "0",
																					step: "any",
																					value: e.hours,
																					onChange: (
																						t
																					) =>
																						ec((a) =>
																							a.map(
																								(
																									a
																								) =>
																									a.id ===
																									e.id
																										? {
																												...a,
																												hours: t
																													.target
																													.value,
																										  }
																										: a
																							)
																						),
																				}),
																			],
																		}),
																		(0, s.jsxs)("div", {
																			className:
																				"md:col-span-2 space-y-2",
																			children: [
																				(0, s.jsx)(C.J, {
																					className:
																						"text-xs",
																					children:
																						"Rate/hr",
																				}),
																				(0, s.jsx)(O.p, {
																					type: "number",
																					min: "0",
																					step: "any",
																					value: e.rate_per_hour,
																					onChange: (
																						t
																					) =>
																						ec((a) =>
																							a.map(
																								(
																									a
																								) =>
																									a.id ===
																									e.id
																										? {
																												...a,
																												rate_per_hour:
																													t
																														.target
																														.value,
																										  }
																										: a
																							)
																						),
																				}),
																			],
																		}),
																		(0, s.jsxs)("div", {
																			className:
																				"md:col-span-2 space-y-2",
																			children: [
																				(0, s.jsx)(C.J, {
																					className:
																						"text-xs",
																					children:
																						"Amount",
																				}),
																				(0, s.jsx)(O.p, {
																					readOnly: !0,
																					value: (
																						(Number(
																							e.hours
																						) || 0) *
																						(Number(
																							e.rate_per_hour
																						) || 0)
																					).toFixed(2),
																				}),
																			],
																		}),
																		(0, s.jsx)("div", {
																			className:
																				"md:col-span-1 flex justify-end",
																			children: (0, s.jsx)(
																				w.$,
																				{
																					type: "button",
																					variant:
																						"ghost",
																					size: "icon",
																					disabled:
																						ed.length <=
																						1,
																					onClick: () =>
																						ec((t) =>
																							t.filter(
																								(
																									t
																								) =>
																									t.id !==
																									e.id
																							)
																						),
																					children: (0,
																					s.jsx)(d.A, {
																						className:
																							"h-4 w-4",
																					}),
																				}
																			),
																		}),
																		(0, s.jsxs)("div", {
																			className:
																				"md:col-span-12 space-y-2",
																			children: [
																				(0, s.jsx)(C.J, {
																					className:
																						"text-xs",
																					children:
																						"Display name",
																				}),
																				(0, s.jsx)(O.p, {
																					value: e.display_name,
																					placeholder:
																						"Name shown on the sales order line (goes to the description)",
																					disabled:
																						!e.vehicle_service_item,
																					onChange: (
																						t
																					) =>
																						ec((a) =>
																							a.map(
																								(
																									a
																								) =>
																									a.id ===
																									e.id
																										? {
																												...a,
																												display_name:
																													t
																														.target
																														.value,
																										  }
																										: a
																							)
																						),
																				}),
																			],
																		}),
																	],
																},
																e.id
															)
														),
														(0, s.jsx)(N._, {
															onClick: () => ec((e) => [...e, z()]),
															label: "Add line",
														}),
													],
												}),
												(0, s.jsx)(b.w, {
													label: "Labour",
													mode: eN,
													onModeChange: (e) => {
														ew(e), "none" === e && eT("");
													},
													value: eS,
													onValueChange: eT,
													subtotal: eG,
												}),
												(0, s.jsxs)("div", {
													className: "space-y-3",
													children: [
														(0, s.jsx)(C.J, { children: "Items" }),
														el.map((e) =>
															(0, s.jsxs)(
																"div",
																{
																	className:
																		"grid gap-3 md:grid-cols-12 items-end border rounded-lg p-3",
																	children: [
																		(0, s.jsxs)("div", {
																			className:
																				"md:col-span-5 space-y-2",
																			children: [
																				(0, s.jsx)(C.J, {
																					className:
																						"text-xs",
																					children:
																						"Spare part *",
																				}),
																				(0, s.jsx)(_.Zi, {
																					options: eH,
																					value: e.spare_part,
																					valueLabel:
																						e.item_name ||
																						void 0,
																					onValueChange:
																						(t) =>
																							void e6(
																								e.id,
																								t
																							),
																					onSearchChange:
																						eh,
																					placeholder:
																						"Search spare part",
																					isLoading: eE,
																					portaled: !0,
																					onCreateNew:
																						() => {
																							ej(
																								el.indexOf(
																									e
																								)
																							),
																								e_(
																									!0
																								);
																						},
																					createNewLabel:
																						"New Spare Part",
																				}),
																			],
																		}),
																		(0, s.jsxs)("div", {
																			className:
																				"md:col-span-2 space-y-2",
																			children: [
																				(0, s.jsx)(C.J, {
																					className:
																						"text-xs",
																					children:
																						"Qty *",
																				}),
																				(0, s.jsx)(O.p, {
																					type: "number",
																					min: "0",
																					step: "any",
																					value: e.qty,
																					onChange: (
																						t
																					) =>
																						eo((a) =>
																							a.map(
																								(
																									a
																								) =>
																									a.id ===
																									e.id
																										? {
																												...a,
																												qty: t
																													.target
																													.value,
																										  }
																										: a
																							)
																						),
																				}),
																			],
																		}),
																		(0, s.jsxs)("div", {
																			className:
																				"md:col-span-2 space-y-2",
																			children: [
																				(0, s.jsx)(C.J, {
																					className:
																						"text-xs",
																					children:
																						"Unit price",
																				}),
																				(0, s.jsx)(O.p, {
																					type: "number",
																					min: "0",
																					step: "any",
																					value: e.unit_price,
																					onChange: (
																						t
																					) =>
																						eo((a) =>
																							a.map(
																								(
																									a
																								) =>
																									a.id ===
																									e.id
																										? {
																												...a,
																												unit_price:
																													t
																														.target
																														.value,
																										  }
																										: a
																							)
																						),
																				}),
																			],
																		}),
																		(0, s.jsxs)("div", {
																			className:
																				"md:col-span-2 space-y-2",
																			children: [
																				(0, s.jsx)(C.J, {
																					className:
																						"text-xs",
																					children:
																						"Amount",
																				}),
																				(0, s.jsx)(O.p, {
																					readOnly: !0,
																					value: (
																						(Number(
																							e.qty
																						) || 0) *
																						(Number(
																							e.unit_price
																						) || 0)
																					).toFixed(2),
																				}),
																			],
																		}),
																		(0, s.jsx)("div", {
																			className:
																				"md:col-span-1 flex justify-end",
																			children: (0, s.jsx)(
																				w.$,
																				{
																					type: "button",
																					variant:
																						"ghost",
																					size: "icon",
																					disabled:
																						el.length <=
																						1,
																					onClick: () =>
																						eo((t) =>
																							t.filter(
																								(
																									t
																								) =>
																									t.id !==
																									e.id
																							)
																						),
																					children: (0,
																					s.jsx)(d.A, {
																						className:
																							"h-4 w-4",
																					}),
																				}
																			),
																		}),
																		(0, s.jsxs)("div", {
																			className:
																				"md:col-span-12 space-y-2",
																			children: [
																				(0, s.jsx)(C.J, {
																					className:
																						"text-xs",
																					children:
																						"Display name",
																				}),
																				(0, s.jsx)(O.p, {
																					value: e.display_name,
																					placeholder:
																						"Name shown on the sales order line (goes to the description)",
																					disabled:
																						!e.spare_part,
																					onChange: (
																						t
																					) =>
																						eo((a) =>
																							a.map(
																								(
																									a
																								) =>
																									a.id ===
																									e.id
																										? {
																												...a,
																												display_name:
																													t
																														.target
																														.value,
																										  }
																										: a
																							)
																						),
																				}),
																			],
																		}),
																	],
																},
																e.id
															)
														),
														(0, s.jsx)(N._, {
															onClick: () => eo((e) => [...e, D()]),
															label: "Add line",
														}),
													],
												}),
												(0, s.jsx)(b.w, {
													label: "Parts",
													mode: eO,
													onModeChange: (e) => {
														eC(e), "none" === e && e$("");
													},
													value: eA,
													onValueChange: e$,
													subtotal: eX,
												}),
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(C.J, { children: "Remarks" }),
														(0, s.jsx)(A.T, {
															value: Q,
															onChange: (e) => ee(e.target.value),
															placeholder:
																"Optional notes for this order",
															rows: 2,
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className:
														"flex items-center gap-2 text-sm text-muted-foreground",
													children: [
														(0, s.jsx)(c.A, { className: "h-4 w-4" }),
														(0, s.jsxs)("span", {
															children: [
																ed.filter(
																	(e) => e.vehicle_service_item
																).length,
																" labour line(s) \xb7",
																" ",
																el.filter((e) => e.spare_part)
																	.length,
																" item line(s) — stock is not required to place the order",
															],
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className:
														"space-y-2 rounded-lg border bg-muted/30 p-4 text-sm",
													children: [
														(0, s.jsxs)("div", {
															className: "flex justify-between",
															children: [
																(0, s.jsx)("span", {
																	className:
																		"text-muted-foreground",
																	children: "Labour subtotal",
																}),
																(0, s.jsx)("span", {
																	className: "tabular-nums",
																	children: M(eG, eK),
																}),
															],
														}),
														e1 > 0
															? (0, s.jsxs)("div", {
																	className:
																		"flex justify-between text-muted-foreground",
																	children: [
																		(0, s.jsx)("span", {
																			children:
																				"Labour discount",
																		}),
																		(0, s.jsxs)("span", {
																			className:
																				"tabular-nums",
																			children: [
																				"-",
																				M(e1, eK),
																			],
																		}),
																	],
															  })
															: null,
														(0, s.jsxs)("div", {
															className: "flex justify-between",
															children: [
																(0, s.jsx)("span", {
																	className:
																		"text-muted-foreground",
																	children: "Items subtotal",
																}),
																(0, s.jsx)("span", {
																	className: "tabular-nums",
																	children: M(eX, eK),
																}),
															],
														}),
														eQ > 0
															? (0, s.jsxs)("div", {
																	className:
																		"flex justify-between text-muted-foreground",
																	children: [
																		(0, s.jsx)("span", {
																			children:
																				"Items discount",
																		}),
																		(0, s.jsxs)("span", {
																			className:
																				"tabular-nums",
																			children: [
																				"-",
																				M(eQ, eK),
																			],
																		}),
																	],
															  })
															: null,
														es || en
															? (0, s.jsx)(j.i, {
																	subtotal: e2,
																	currency: eK,
																	applyTaxes: es,
																	applyTaxWithholding: en,
																	preview: eL,
																	isLoading: eD,
																	totalOverride: eL
																		? eL.order_grand_total
																		: null,
																	totalLabel: es
																		? "Order total (incl. VAT)"
																		: "Order total",
															  })
															: (0, s.jsxs)("div", {
																	className:
																		"flex justify-between border-t pt-2 text-base font-medium",
																	children: [
																		(0, s.jsx)("span", {
																			children:
																				"Order total",
																		}),
																		(0, s.jsx)("span", {
																			className:
																				"tabular-nums",
																			children: M(e2, eK),
																		}),
																	],
															  }),
														es
															? (0, s.jsx)("p", {
																	className:
																		"text-xs text-muted-foreground",
																	children:
																		"VAT is applied from the DMS Settings Default Taxes and Charges Template and added to the grand total when the order is saved.",
															  })
															: null,
														en
															? (0, s.jsxs)("p", {
																	className:
																		"text-xs text-muted-foreground",
																	children: [
																		"TCS is withheld on the invoice, not on the order — the order total above is not reduced by it. The invoice will be raised for",
																		" ",
																		M(
																			eL
																				? eL.grand_total
																				: e2,
																			eK
																		),
																		", of which ",
																		M(
																			eL
																				? Math.abs(
																						eL.withholding_amount ||
																							0
																				  )
																				: 0,
																			eK
																		),
																		" is paid to the tax authority by the customer instead.",
																	],
															  })
															: null,
													],
												}),
											],
										}),
									],
								}),
							],
						}),
						(0, s.jsxs)(v.h, {
							children: [
								(0, s.jsx)(w.$, {
									type: "button",
									variant: "outline",
									className: "min-h-11 w-full sm:w-auto",
									onClick: () => t("orders"),
									children: "Cancel",
								}),
								(0, s.jsx)(w.$, {
									type: "button",
									variant: "outline",
									className: "min-h-11 w-full sm:w-auto",
									disabled: ek,
									onClick: () => void e7("draft"),
									children: ek
										? (0, s.jsxs)(s.Fragment, {
												children: [
													(0, s.jsx)(m.A, {
														className: "mr-2 h-4 w-4 animate-spin",
													}),
													"Saving…",
												],
										  })
										: (0, s.jsxs)(s.Fragment, {
												children: [
													(0, s.jsx)(u.A, { className: "mr-2 h-4 w-4" }),
													"Save as Draft",
												],
										  }),
								}),
								(0, s.jsxs)(w.$, {
									type: "submit",
									form: "new-order-form",
									disabled: ek,
									className: "min-h-11 w-full sm:w-auto",
									children: [
										ek
											? (0, s.jsx)(m.A, {
													className: "mr-2 h-4 w-4 animate-spin",
											  })
											: (0, s.jsx)(p.A, { className: "mr-2 h-4 w-4" }),
										"Submit order",
									],
								}),
							],
						}),
						(0, s.jsx)(g.B, {
							open: ef,
							onOpenChange: eg,
							onCreated: (e) => {
								let t = ed[ey]?.id;
								t && e9(t, e),
									eu(e),
									l.o.success("Service item created and selected.");
							},
						}),
						(0, s.jsx)(y.d, {
							open: ex,
							onOpenChange: e_,
							onCreated: (e, t, s) => {
								let r = el[eb]?.id;
								r && e6(r, s || e, t),
									eh(e),
									a((e) => Array.isArray(e) && "order-parts" === e[0], void 0, {
										revalidate: !0,
									}),
									l.o.success(`Spare part ${t} created and selected.`);
							},
						}),
					],
				});
			}
		},
		65816: (e, t, a) => {
			a.d(t, {
				Fi: () => l,
				NU: () => m,
				PT: () => d,
				Xs: () => i,
				Yh: () => o,
				_I: () => h,
				m3: () => x,
				rG: () => c,
				wJ: () => u,
				yL: () => p,
				yV: () => n,
			});
			var s = a(49876);
			let r = "dms.api.orders";
			async function n(e) {
				return (0, s.AT)(`/api/method/${r}.list_dms_orders`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						status: e?.status || null,
						customer: e?.customer || null,
						from_date: e?.from_date || null,
						to_date: e?.to_date || null,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function i(e) {
				return (0, s.AT)(`/api/method/${r}.get_dms_order`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function l(e) {
				return (0, s.AT)(`/api/method/${r}.create_dms_order`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function o(e) {
				return (0, s.AT)(`/api/method/${r}.update_dms_order`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function d(e) {
				return (0, s.AT)(`/api/method/${r}.submit_dms_order`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function c(e) {
				return (0, s.AT)(`/api/method/${r}.cancel_dms_order`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function m(e) {
				return (0, s.AT)(`/api/method/${r}.delete_draft_dms_order`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function u(e) {
				return (0, s.AT)(`/api/method/${r}.amend_dms_order`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function p(e, t) {
				return (0, s.AT)(`/api/method/${r}.record_dms_order_payment`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function h(e, t) {
				return (0, s.AT)(`/api/method/${r}.create_dms_order_invoice`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t || {} }),
				});
			}
			async function x(e) {
				return (0, s.AT)(`/api/method/${r}.get_order_tax_preview`, {
					method: "POST",
					body: JSON.stringify({
						data: {
							customer: e.customer || null,
							company: e.company || null,
							warehouse: e.warehouse || null,
							currency: e.currency || null,
							transaction_date: e.transaction_date || null,
							delivery_date: e.delivery_date || null,
							apply_taxes: +!!e.apply_taxes,
							apply_tax_withholding: +!!e.apply_tax_withholding,
							parts: e.parts?.length ? e.parts : null,
							labour: e.labour?.length ? e.labour : null,
							labour_discount: e.labour_discount || null,
							parts_discount: e.parts_discount || null,
						},
					}),
				});
			}
		},
		84437: (e, t, a) => {
			a.d(t, { S: () => l });
			var s = a(95155);
			a(12115);
			var r = a(47279),
				n = a(94514),
				i = a(91337);
			function l({ className: e, ...t }) {
				return (0, s.jsx)(r.bL, {
					"data-slot": "checkbox",
					className: (0, i.cn)(
						"peer border-input dark:bg-input/30 data-[state=checked]:bg-dms-green data-[state=checked]:text-white dark:data-[state=checked]:bg-dms-green data-[state=checked]:border-dms-green focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 cursor-pointer rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
						e
					),
					...t,
					children: (0, s.jsx)(r.C1, {
						"data-slot": "checkbox-indicator",
						className: "flex items-center justify-center text-current transition-none",
						children: (0, s.jsx)(n.A, { className: "size-3.5" }),
					}),
				});
			}
		},
		88361: (e, t, a) => {
			function s(e, t) {
				if ("none" === e) return 0;
				let a = parseFloat(t);
				return Number.isFinite(a) && a > 0 ? a : 0;
			}
			function r(e, t, a) {
				return "none" === t || e <= 0 || a <= 0
					? 0
					: "percentage" === t
					? (Math.min(a, 100) / 100) * e
					: Math.min(a, e);
			}
			function n(e, t) {
				let a = s(e, t);
				if ("none" !== e && !(a <= 0)) return { type: e, value: a };
			}
			function i(e) {
				let t = (e || "").trim().toLowerCase();
				return "percentage" === t || "percent" === t
					? "percentage"
					: "amount" === t
					? "amount"
					: "none";
			}
			function l(e, t) {
				let a = s(e, t);
				return "none" === e || a <= 0
					? { discount_type: "", discount_value: 0 }
					: {
							discount_type:
								"percentage" === e ? "Percentage" : "amount" === e ? "Amount" : "",
							discount_value: a,
					  };
			}
			function o(e, t, a) {
				return r(e, t, a);
			}
			function d(e, t) {
				let a = i(e),
					s = Number(t || 0);
				return "none" === a || s <= 0
					? ""
					: "percentage" === a
					? `${s}%`
					: s.toLocaleString();
			}
			a.d(t, {
				HW: () => r,
				O6: () => o,
				OC: () => l,
				VJ: () => d,
				Z_: () => n,
				mW: () => s,
				nO: () => i,
			});
		},
		89307: (e, t, a) => {
			a.d(t, { i: () => l });
			var s = a(95155),
				r = a(6296),
				n = a(91337);
			function i(e, t) {
				let a = Number(e || 0);
				try {
					return new Intl.NumberFormat("en-US", {
						style: "currency",
						currency: t || "ETB",
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					}).format(a);
				} catch {
					return `${a.toFixed(2)} ${t || ""}`.trim();
				}
			}
			function l({
				subtotal: e,
				currency: t,
				applyTaxes: a,
				applyTaxWithholding: o,
				preview: d,
				isLoading: c,
				totalOverride: m,
				totalLabel: u,
				className: p,
			}) {
				let h = d?.vat_amount || 0,
					x = d?.withholding_amount || 0,
					_ = null != m ? m : d ? d.grand_total : e,
					f = u || `Total payable${a ? " (incl. VAT)" : ""}`,
					g = d?.currency || t || void 0;
				return (0, s.jsxs)("div", {
					className: (0, n.cn)(
						"space-y-1.5 rounded-md border bg-muted/30 p-3 text-sm",
						p
					),
					children: [
						(0, s.jsxs)("div", {
							className: "flex items-center justify-between gap-3",
							children: [
								(0, s.jsx)("span", {
									className: "text-muted-foreground",
									children: "Net total (excl. tax)",
								}),
								(0, s.jsx)("span", {
									className: "font-medium tabular-nums",
									children: i(e, g),
								}),
							],
						}),
						a
							? (0, s.jsxs)("div", {
									className: "flex items-center justify-between gap-3",
									children: [
										(0, s.jsxs)("span", {
											className: "text-muted-foreground",
											children: [
												"VAT",
												d?.tax_template
													? (0, s.jsxs)("span", {
															className: "ml-1 text-xs",
															children: ["(", d.tax_template, ")"],
													  })
													: null,
											],
										}),
										(0, s.jsx)("span", {
											className: "font-medium tabular-nums",
											children: c
												? (0, s.jsx)(r.A, {
														className:
															"h-3.5 w-3.5 animate-spin text-muted-foreground",
												  })
												: i(h, g),
										}),
									],
							  })
							: null,
						o
							? (0, s.jsxs)("div", {
									className: "flex items-center justify-between gap-3",
									children: [
										(0, s.jsxs)("span", {
											className: "text-muted-foreground",
											children: [
												"Tax withholding (TCS)",
												d?.withholding_category
													? (0, s.jsxs)("span", {
															className: "ml-1 text-xs",
															children: [
																"(",
																d.withholding_category,
																")",
															],
													  })
													: null,
											],
										}),
										(0, s.jsx)("span", {
											className: "font-medium tabular-nums text-destructive",
											children: c
												? (0, s.jsx)(r.A, {
														className:
															"h-3.5 w-3.5 animate-spin text-muted-foreground",
												  })
												: i(x, g),
										}),
									],
							  })
							: null,
						(0, s.jsxs)("div", {
							className: "flex items-center justify-between gap-3 border-t pt-1.5",
							children: [
								(0, s.jsx)("span", { className: "font-medium", children: f }),
								(0, s.jsx)("span", {
									className: "font-semibold tabular-nums",
									children: c
										? (0, s.jsx)(r.A, {
												className:
													"h-4 w-4 animate-spin text-muted-foreground",
										  })
										: i(_, g),
								}),
							],
						}),
						d?.message
							? (0, s.jsx)("p", {
									className: "pt-1 text-xs text-destructive",
									children: d.message,
							  })
							: null,
						c && !d
							? (0, s.jsx)("p", {
									className: "pt-1 text-xs text-muted-foreground",
									children: "Calculating taxes…",
							  })
							: null,
					],
				});
			}
		},
	},
]);
