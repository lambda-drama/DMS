"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[5505],
	{
		19659: (e, a, t) => {
			t.d(a, { k: () => v });
			var s = t(95155),
				n = t(12115),
				r = t(90901),
				l = t(44855),
				i = t(32144),
				o = t(10086),
				d = t(4474),
				c = t(39658),
				u = t(79792),
				m = t(74350),
				h = t(6296),
				p = t(66609);
			function v({
				value: e,
				onValueChange: a,
				valueLabel: t,
				placeholder: g = "Search brand…",
				disabled: x,
				className: b,
				allowCreate: f = !0,
			}) {
				let { mutate: y } = (0, r.iX)(),
					[j, S] = (0, n.useState)(""),
					[N, w] = (0, n.useState)(t || ""),
					[_, C] = (0, n.useState)(!1),
					[A, T] = (0, n.useState)(!1),
					[k, O] = (0, n.useState)(""),
					{ data: z, isLoading: J } = (0, l.Ay)(["crm-link-brands", j], () =>
						(0, i.lb)(j || void 0)
					),
					L = (0, n.useMemo)(
						() =>
							(z || []).map((e) => ({
								value: String(e.name),
								label: String(e.label || e.name),
							})),
						[z]
					),
					M = (e && (N || t)) || L.find((a) => a.value === e)?.label || void 0,
					P = async () => {
						let e = k.trim();
						if (!e) return void p.o.error("Brand name is required");
						T(!0);
						try {
							let t = await (0, i.HL)(e);
							await y(
								(e) => Array.isArray(e) && String(e[0]).includes("brand"),
								void 0,
								{ revalidate: !0 }
							),
								w(t.label || t.name),
								a(t.name),
								C(!1),
								O(""),
								p.o.success(`Created: ${t.label || t.name}`);
						} catch (e) {
							p.o.error(e instanceof Error ? e.message : "Could not create brand");
						} finally {
							T(!1);
						}
					};
				return (0, s.jsxs)(s.Fragment, {
					children: [
						(0, s.jsx)(o.Zi, {
							className: b,
							options: L,
							value: e,
							valueLabel: M,
							onValueChange: (e) => {
								let t = L.find((a) => a.value === e);
								w(t?.label || e || ""), a(e || "");
							},
							onSearchChange: S,
							placeholder: g,
							emptyMessage: "No brands found",
							isLoading: J,
							disabled: x,
							onCreateNew: f && !x ? () => C(!0) : void 0,
							createNewLabel: "Create brand",
						}),
						(0, s.jsx)(m.lG, {
							open: _,
							onOpenChange: C,
							children: (0, s.jsxs)(m.Cf, {
								className: "sm:max-w-md",
								children: [
									(0, s.jsxs)(m.c7, {
										children: [
											(0, s.jsx)(m.L3, { children: "New brand" }),
											(0, s.jsx)(m.rr, {
												children:
													"Creates a Brand master and selects it on this form.",
											}),
										],
									}),
									(0, s.jsxs)("div", {
										className: "space-y-1 py-2",
										children: [
											(0, s.jsx)(u.J, { children: "Brand name *" }),
											(0, s.jsx)(c.p, {
												value: k,
												onChange: (e) => O(e.target.value),
												placeholder: "e.g. Jetour",
											}),
										],
									}),
									(0, s.jsxs)(m.Es, {
										children: [
											(0, s.jsx)(d.$, {
												type: "button",
												variant: "outline",
												onClick: () => C(!1),
												children: "Cancel",
											}),
											(0, s.jsx)(d.$, {
												type: "button",
												onClick: () => void P(),
												disabled: A,
												children: A
													? (0, s.jsx)(h.A, {
															className: "h-4 w-4 animate-spin",
													  })
													: "Create & select",
											}),
										],
									}),
								],
							}),
						}),
					],
				});
			}
		},
		26518: (e, a, t) => {
			t.d(a, { bq: () => u, eb: () => h, gC: () => m, l6: () => d, yv: () => c });
			var s = t(95155);
			t(12115);
			var n = t(40287),
				r = t(66088),
				l = t(94514),
				i = t(9921),
				o = t(91337);
			function d({ ...e }) {
				return (0, s.jsx)(n.bL, { "data-slot": "select", ...e });
			}
			function c({ ...e }) {
				return (0, s.jsx)(n.WT, { "data-slot": "select-value", ...e });
			}
			function u({ className: e, size: a = "default", children: t, ...l }) {
				return (0, s.jsxs)(n.l9, {
					"data-slot": "select-trigger",
					"data-size": a,
					className: (0, o.cn)(
						"border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-full border bg-transparent px-4 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...l,
					children: [
						t,
						(0, s.jsx)(n.In, {
							asChild: !0,
							children: (0, s.jsx)(r.A, { className: "size-4 opacity-50" }),
						}),
					],
				});
			}
			function m({ className: e, children: a, position: t = "popper", ...r }) {
				return (0, s.jsx)(n.ZL, {
					children: (0, s.jsxs)(n.UC, {
						"data-slot": "select-content",
						className: (0, o.cn)(
							"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
							"popper" === t &&
								"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
							e
						),
						position: t,
						...r,
						children: [
							(0, s.jsx)(p, {}),
							(0, s.jsx)(n.LM, {
								className: (0, o.cn)(
									"p-1",
									"popper" === t &&
										"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
								),
								children: a,
							}),
							(0, s.jsx)(v, {}),
						],
					}),
				});
			}
			function h({ className: e, children: a, ...t }) {
				return (0, s.jsxs)(n.q7, {
					"data-slot": "select-item",
					className: (0, o.cn)(
						"focus:bg-dms-green-light focus:text-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
						e
					),
					...t,
					children: [
						(0, s.jsx)("span", {
							className:
								"absolute right-2 flex size-3.5 items-center justify-center",
							children: (0, s.jsx)(n.VF, {
								children: (0, s.jsx)(l.A, { className: "size-4" }),
							}),
						}),
						(0, s.jsx)(n.p4, { children: a }),
					],
				});
			}
			function p({ className: e, ...a }) {
				return (0, s.jsx)(n.PP, {
					"data-slot": "select-scroll-up-button",
					className: (0, o.cn)(
						"flex cursor-default items-center justify-center py-1",
						e
					),
					...a,
					children: (0, s.jsx)(i.A, { className: "size-4" }),
				});
			}
			function v({ className: e, ...a }) {
				return (0, s.jsx)(n.wn, {
					"data-slot": "select-scroll-down-button",
					className: (0, o.cn)(
						"flex cursor-default items-center justify-center py-1",
						e
					),
					...a,
					children: (0, s.jsx)(r.A, { className: "size-4" }),
				});
			}
		},
		37814: (e, a, t) => {
			t.d(a, { I: () => v });
			var s = t(95155),
				n = t(12115),
				r = t(90901),
				l = t(44855),
				i = t(32144),
				o = t(10086),
				d = t(4474),
				c = t(39658),
				u = t(79792),
				m = t(74350),
				h = t(6296),
				p = t(66609);
			function v({
				value: e,
				onValueChange: a,
				brand: t,
				valueLabel: g,
				placeholder: x,
				disabled: b,
				className: f,
				allowCreate: y = !0,
			}) {
				let { mutate: j } = (0, r.iX)(),
					[S, N] = (0, n.useState)(""),
					[w, _] = (0, n.useState)(g || ""),
					[C, A] = (0, n.useState)(!1),
					[T, k] = (0, n.useState)(!1),
					[O, z] = (0, n.useState)(""),
					[J, L] = (0, n.useState)(""),
					[M, P] = (0, n.useState)("Petrol"),
					[$, E] = (0, n.useState)("Automatic (AT)"),
					[V, F] = (0, n.useState)(""),
					{ data: Z, isLoading: B } = (0, l.Ay)(["crm-link-models", S, t], () =>
						(0, i.FQ)(S || void 0, t || void 0)
					),
					q = (0, n.useMemo)(
						() =>
							(Z || []).map((e) => ({
								value: String(e.name),
								label: String(e.model_name || e.model_code || e.name),
								description:
									[e.model_code, e.variant, e.brand_label || e.brand]
										.filter(Boolean)
										.join(" \xb7 ") || void 0,
								variant: String(e.variant || ""),
								model_name: String(e.model_name || ""),
								brand: String(e.brand || ""),
							})),
						[Z]
					),
					D = (e && (w || g)) || q.find((a) => a.value === e)?.label || void 0,
					G = async () => {
						if (!O.trim()) return void p.o.error("Model name is required");
						k(!0);
						try {
							let e = await (0, i.Zk)({
								model_name: O.trim(),
								brand: t || void 0,
								model_code: J.trim() || void 0,
								fuel_type: M,
								transmission: $,
								variant: V.trim() || void 0,
							});
							await j(
								(e) => Array.isArray(e) && String(e[0]).includes("model"),
								void 0,
								{ revalidate: !0 }
							),
								_(e.label || e.name),
								a(e.name, {
									model_name: e.label,
									variant: V.trim() || void 0,
									brand: t || void 0,
								}),
								A(!1),
								z(""),
								L(""),
								F(""),
								p.o.success(`Created: ${e.label || e.name}`);
						} catch (e) {
							p.o.error(
								e instanceof Error ? e.message : "Could not create vehicle model"
							);
						} finally {
							k(!1);
						}
					};
				return (0, s.jsxs)(s.Fragment, {
					children: [
						(0, s.jsx)(o.Zi, {
							className: f,
							options: q,
							value: e,
							valueLabel: D,
							onValueChange: (e) => {
								let t = q.find((a) => a.value === e);
								_(t?.label || e || ""),
									a(e || "", {
										model_name: t?.model_name,
										variant: t?.variant,
										brand: t?.brand,
									});
							},
							onSearchChange: N,
							placeholder:
								x || (t ? `Search ${t} models…` : "Search vehicle models…"),
							emptyMessage: t
								? "No models for this brand — create one with +"
								: "No vehicle models found",
							isLoading: B,
							disabled: b,
							onCreateNew: y && !b ? () => A(!0) : void 0,
							createNewLabel: "Create vehicle model",
						}),
						(0, s.jsx)(m.lG, {
							open: C,
							onOpenChange: A,
							children: (0, s.jsxs)(m.Cf, {
								className: "sm:max-w-md",
								children: [
									(0, s.jsxs)(m.c7, {
										children: [
											(0, s.jsx)(m.L3, { children: "New vehicle model" }),
											(0, s.jsx)(m.rr, {
												children:
													"Creates the Item + Vehicle Model and selects it on this form.",
											}),
										],
									}),
									(0, s.jsxs)("div", {
										className: "grid gap-3 py-2",
										children: [
											(0, s.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, s.jsx)(u.J, { children: "Model name *" }),
													(0, s.jsx)(c.p, {
														value: O,
														onChange: (e) => z(e.target.value),
														placeholder: "e.g. Jetour T2",
													}),
												],
											}),
											(0, s.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, s.jsx)(u.J, {
														children: "Model code / Item code",
													}),
													(0, s.jsx)(c.p, {
														value: J,
														onChange: (e) => L(e.target.value),
														placeholder: "Defaults to model name",
													}),
												],
											}),
											(0, s.jsxs)("div", {
												className: "grid grid-cols-2 gap-2",
												children: [
													(0, s.jsxs)("div", {
														className: "space-y-1",
														children: [
															(0, s.jsx)(u.J, {
																children: "Fuel type",
															}),
															(0, s.jsx)("select", {
																className:
																	"h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
																value: M,
																onChange: (e) => P(e.target.value),
																children: [
																	"Petrol",
																	"Diesel",
																	"Hybrid",
																	"PHEV",
																	"EV",
																	"CNG",
																	"LPG",
																].map((e) =>
																	(0, s.jsx)(
																		"option",
																		{ children: e },
																		e
																	)
																),
															}),
														],
													}),
													(0, s.jsxs)("div", {
														className: "space-y-1",
														children: [
															(0, s.jsx)(u.J, {
																children: "Transmission",
															}),
															(0, s.jsx)("select", {
																className:
																	"h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
																value: $,
																onChange: (e) => E(e.target.value),
																children: [
																	"Manual (MT)",
																	"Automatic (AT)",
																	"CVT",
																	"DCT",
																	"AMT",
																	"EV Single Speed",
																].map((e) =>
																	(0, s.jsx)(
																		"option",
																		{ children: e },
																		e
																	)
																),
															}),
														],
													}),
												],
											}),
											(0, s.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, s.jsx)(u.J, { children: "Variant" }),
													(0, s.jsx)(c.p, {
														value: V,
														onChange: (e) => F(e.target.value),
													}),
												],
											}),
											t
												? (0, s.jsxs)("p", {
														className: "text-xs text-muted-foreground",
														children: ["Brand: ", t],
												  })
												: null,
										],
									}),
									(0, s.jsxs)(m.Es, {
										children: [
											(0, s.jsx)(d.$, {
												type: "button",
												variant: "outline",
												onClick: () => A(!1),
												children: "Cancel",
											}),
											(0, s.jsx)(d.$, {
												type: "button",
												onClick: () => void G(),
												disabled: T,
												children: T
													? (0, s.jsx)(h.A, {
															className: "h-4 w-4 animate-spin",
													  })
													: "Create & select",
											}),
										],
									}),
								],
							}),
						}),
					],
				});
			}
		},
		42074: (e, a, t) => {
			t.d(a, { h: () => i });
			var s = t(95155),
				n = t(12115),
				r = t(47650),
				l = t(91337);
			function i({ children: e, className: a, align: t = "end" }) {
				let [o, d] = (0, n.useState)(!1);
				(0, n.useEffect)(() => (d(!0), () => d(!1)), []);
				let c = (0, s.jsx)("div", {
					role: "toolbar",
					"aria-label": "Form actions",
					className: (0, l.cn)(
						"fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_24px_rgba(15,61,94,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-card/90",
						"pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3",
						"lg:left-64",
						a
					),
					children: (0, s.jsx)("div", {
						className: (0, l.cn)(
							"mx-auto w-full max-w-[1600px] px-3 sm:px-4 lg:px-6",
							"between" === t
								? "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3"
								: "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3"
						),
						children: e,
					}),
				});
				return o ? (0, r.createPortal)(c, document.body) : null;
			}
		},
		71376: (e, a, t) => {
			t.d(a, {
				Dh: () => l,
				Mx: () => r,
				Q3: () => o,
				ih: () => d,
				ne: () => c,
				uh: () => u,
				xn: () => i,
			});
			var s = t(49876);
			let n = "dms.api.vehicles";
			async function r(e) {
				return (0, s.AT)(`/api/method/${n}.get_vehicles`, {
					method: "POST",
					body: JSON.stringify({
						customer: e?.customer || null,
						search: e?.search || null,
						vehicle_status: e?.vehicle_status || null,
						warranty_status: e?.warranty_status || null,
						include_other_companies: +!!e?.include_other_companies,
						limit: e?.limit || 50,
						offset: e?.offset || 0,
					}),
				});
			}
			async function l(e) {
				return (0, s.AT)(`/api/method/${n}.get_vehicle`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function i(e) {
				return (0, s.AT)(`/api/method/${n}.create_vehicle`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function o(e, a) {
				return (0, s.AT)(`/api/method/${n}.update_vehicle`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: a }),
				});
			}
			async function d(e) {
				return (0, s.AT)(`/api/method/${n}.delete_vehicle`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function c(e) {
				return (0, s.AT)(`/api/method/${n}.get_vehicle_items`, {
					method: "POST",
					body: JSON.stringify({ search: e || null }),
				});
			}
			async function u() {
				return (0, s.AT)(`/api/method/${n}.get_vehicle_item_groups`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
		},
		75273: (e, a, t) => {
			t.d(a, { s: () => c });
			var s = t(95155),
				n = t(12115),
				r = t(90901),
				l = t(44855),
				i = t(32144),
				o = t(10086),
				d = t(92751);
			function c({
				value: e,
				onValueChange: a,
				valueLabel: t,
				placeholder: u = "Search color…",
				disabled: m,
				className: h,
				allowCreate: p = !0,
			}) {
				let { mutate: v } = (0, r.iX)(),
					[g, x] = (0, n.useState)(""),
					[b, f] = (0, n.useState)(t || ""),
					{ data: y, isLoading: j } = (0, l.Ay)(["crm-link-colors", g], () =>
						(0, i.HT)(g || void 0)
					),
					S = (0, n.useMemo)(
						() =>
							(y || []).map((e) => ({
								value: String(e.name),
								label: String(e.label || e.name),
							})),
						[y]
					),
					N = (e && (b || t)) || S.find((a) => a.value === e)?.label || void 0,
					w = (0, s.jsx)(o.Zi, {
						className: h,
						options: S,
						value: e,
						valueLabel: N,
						onValueChange: (e) => {
							let t = S.find((a) => a.value === e);
							f(t?.label || e || ""), a(e || "");
						},
						onSearchChange: x,
						placeholder: u,
						emptyMessage: "No colors found",
						isLoading: j,
						disabled: m,
					});
				return !p || m
					? w
					: (0, s.jsx)(d.Z, {
							doctype: "Color",
							onCreated: (e, t) => {
								f(t || e),
									a(e),
									v(
										(e) => Array.isArray(e) && String(e[0]).includes("color"),
										void 0,
										{ revalidate: !0 }
									);
							},
							children: w,
					  });
			}
		},
	},
]);
