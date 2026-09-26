"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[4950],
	{
		15306: (e, s, t) => {
			t.d(s, { Xi: () => n, av: () => o, j7: () => c, tU: () => r });
			var a = t(95155);
			t(12115);
			var i = t(57518),
				l = t(91337);
			function r({ className: e, ...s }) {
				return (0, a.jsx)(i.bL, {
					"data-slot": "tabs",
					className: (0, l.cn)("flex flex-col gap-2", e),
					...s,
				});
			}
			function c({ className: e, ...s }) {
				return (0, a.jsx)(i.B8, {
					"data-slot": "tabs-list",
					className: (0, l.cn)(
						"bg-muted text-muted-foreground inline-flex h-9 w-fit max-w-full items-center justify-start overflow-x-auto rounded-lg p-[3px]",
						e
					),
					...s,
				});
			}
			function n({ className: e, ...s }) {
				return (0, a.jsx)(i.l9, {
					"data-slot": "tabs-trigger",
					className: (0, l.cn)(
						"data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...s,
				});
			}
			function o({ className: e, ...s }) {
				return (0, a.jsx)(i.UC, {
					"data-slot": "tabs-content",
					className: (0, l.cn)("outline-none data-[state=inactive]:hidden", e),
					...s,
				});
			}
		},
		33745: (e, s, t) => {
			t.d(s, { l: () => n });
			var a = t(95155),
				i = t(51914),
				l = t(63360),
				r = t(4474),
				c = t(91337);
			function n({ module: e, label: s, className: t, ...o }) {
				let { canCreate: d } = (0, l.Sk)();
				return d(e)
					? (0, a.jsxs)(r.$, {
							"aria-label": s,
							title: s,
							className: (0, c.cn)(
								"h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-auto sm:px-4 sm:py-2",
								t
							),
							...o,
							children: [
								(0, a.jsx)(i.A, { className: "h-4 w-4 shrink-0" }),
								(0, a.jsx)("span", {
									className: "hidden sm:inline sm:ml-2",
									children: s,
								}),
							],
					  })
					: null;
			}
		},
		34950: (e, s, t) => {
			t.r(s), t.d(s, { default: () => X });
			var a = t(95155),
				i = t(12115),
				l = t(44855),
				r = t(66609),
				c = t(20572),
				n = t(53483),
				o = t(31521),
				d = t(98883),
				m = t(6296),
				u = t(90901),
				h = t(74350),
				x = t(4474),
				v = t(84437),
				p = t(39658),
				j = t(79792),
				_ = t(39540),
				f = t(10086),
				g = t(36020),
				b = t(66348),
				N = t(63360);
			function y({ open: e, onOpenChange: s, serviceItem: t, onUpdated: l }) {
				let { mutate: c } = (0, u.iX)(),
					{ canEditPrice: n } = (0, N.Sk)(),
					[o, d] = (0, i.useState)(!1),
					[w, C] = (0, i.useState)(null),
					[k, S] = (0, i.useState)(""),
					[A, $] = (0, i.useState)(""),
					[E, J] = (0, i.useState)(""),
					[M, F] = (0, i.useState)({
						service_item: "",
						custom_service_code: "",
						custom_item_name: "",
						custom_vehicle_model: "",
						custom_category: "",
						custom_frt: "",
						custom_cat_code: "",
						custom_sub_code: "",
						custom_estimated_timehours: "",
						custom_rate: "",
						custom_description: "",
						custom_active: !0,
					}),
					{ data: I } = (0, g.iR)(A),
					{ data: U } = (0, g.qg)(E);
				(0, i.useEffect)(() => {
					if (!e || !t) return;
					C(null),
						S(
							(t.name || "").trim() ||
								(t.custom_service_code || "").trim() ||
								(t.custom_erpnext_item || "").trim()
						);
					let s = t.service_item || "";
					F({
						service_item: s,
						custom_service_code: t.custom_service_code || "",
						custom_item_name: t.custom_item_name || s || "",
						custom_vehicle_model: t.custom_vehicle_model || "",
						custom_category: t.custom_category || "",
						custom_frt: t.custom_frt || "",
						custom_cat_code: t.custom_cat_code || "",
						custom_sub_code: t.custom_sub_code || "",
						custom_estimated_timehours:
							null != t.custom_estimated_timehours
								? String(t.custom_estimated_timehours)
								: "",
						custom_rate: null != t.custom_rate ? String(t.custom_rate) : "",
						custom_description: t.custom_description || "",
						custom_active: 1 === Number(t.custom_active),
					}),
						$(""),
						J("");
				}, [e, t]);
				let L = (0, i.useMemo)(
						() =>
							(I || []).map((e) => ({
								value: e.name,
								label: e.model_name || e.name,
							})),
						[I]
					),
					Q = (0, i.useMemo)(
						() =>
							(U || []).map((e) => ({
								value: e.name,
								label: e.service_type_name || e.name,
							})),
						[U]
					);
				async function B() {
					let e = k || (t?.name || "").trim() || (t?.custom_service_code || "").trim();
					if (!e) {
						C("No service item selected"), r.o.error("No service item selected");
						return;
					}
					if (!M.service_item.trim()) {
						C("Service item name is required"),
							r.o.error("Service item name is required");
						return;
					}
					d(!0), C(null);
					try {
						await b.Qn(e, {
							service_item: M.service_item.trim(),
							custom_service_code: M.custom_service_code.trim() || null,
							custom_item_name:
								M.custom_item_name.trim() || M.service_item.trim() || null,
							custom_vehicle_model: M.custom_vehicle_model || null,
							custom_category: M.custom_category || null,
							custom_frt: M.custom_frt.trim() || null,
							custom_cat_code: M.custom_cat_code.trim() || null,
							custom_sub_code: M.custom_sub_code.trim() || null,
							custom_estimated_timehours: M.custom_estimated_timehours
								? Number(M.custom_estimated_timehours)
								: null,
							custom_rate: M.custom_rate ? Number(M.custom_rate) : null,
							custom_description: M.custom_description.trim() || null,
							custom_active: +!!M.custom_active,
						}),
							await c(
								(e) =>
									Array.isArray(e) &&
									("vehicle-service-items-master" === e[0] ||
										"vehicle-service-item" === e[0]),
								void 0,
								{ revalidate: !0 }
							),
							r.o.success("Service item updated"),
							l?.(e),
							s(!1);
					} catch (s) {
						let e = s instanceof Error ? s.message : "Failed to update service item";
						C(e), r.o.error(e);
					} finally {
						d(!1);
					}
				}
				return (0, a.jsx)(h.lG, {
					open: e,
					onOpenChange: s,
					children: (0, a.jsx)(h.Cf, {
						className: "sm:max-w-2xl max-h-[90vh] overflow-y-auto",
						children: (0, a.jsxs)("form", {
							noValidate: !0,
							onSubmit: (e) => {
								e.preventDefault(), B();
							},
							children: [
								(0, a.jsxs)(h.c7, {
									children: [
										(0, a.jsx)(h.L3, { children: "Edit service item" }),
										(0, a.jsx)(h.rr, {
											children:
												"Update labour / vehicle service master details and rate.",
										}),
									],
								}),
								(0, a.jsxs)("div", {
									className: "grid gap-3 py-4",
									children: [
										w
											? (0, a.jsx)("div", {
													className:
														"rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
													children: w,
											  })
											: null,
										(0, a.jsxs)("div", {
											className: "grid grid-cols-2 gap-2",
											children: [
												(0, a.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, a.jsx)(j.J, {
															children: "Service item *",
														}),
														(0, a.jsx)(p.p, {
															value: M.service_item,
															onChange: (e) => {
																let s = e.target.value;
																F((e) => ({
																	...e,
																	service_item: s,
																	custom_item_name:
																		e.custom_item_name.trim() &&
																		e.custom_item_name !==
																			e.service_item
																			? e.custom_item_name
																			: s,
																}));
															},
															autoFocus: !0,
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, a.jsx)(j.J, {
															children: "Service code",
														}),
														(0, a.jsx)(p.p, {
															value: M.custom_service_code,
															onChange: (e) =>
																F((s) => ({
																	...s,
																	custom_service_code:
																		e.target.value,
																})),
														}),
													],
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [
												(0, a.jsx)(v.S, {
													id: "edit-service-item-active",
													checked: M.custom_active,
													onCheckedChange: (e) =>
														F((s) => ({ ...s, custom_active: !!e })),
												}),
												(0, a.jsx)(j.J, {
													htmlFor: "edit-service-item-active",
													className: "cursor-pointer font-normal",
													children: "Active",
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-1",
											children: [
												(0, a.jsx)(j.J, { children: "Item name" }),
												(0, a.jsx)(p.p, {
													value: M.custom_item_name,
													onChange: (e) =>
														F((s) => ({
															...s,
															custom_item_name: e.target.value,
														})),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "grid grid-cols-2 gap-2",
											children: [
												(0, a.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, a.jsx)(j.J, {
															children: "Vehicle model",
														}),
														(0, a.jsx)(f.Zi, {
															options: L,
															value: M.custom_vehicle_model,
															onValueChange: (e) =>
																F((s) => ({
																	...s,
																	custom_vehicle_model: e,
																})),
															onSearchChange: $,
															placeholder: "Search models...",
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, a.jsx)(j.J, { children: "Category" }),
														(0, a.jsx)(f.Zi, {
															options: Q,
															value: M.custom_category,
															onValueChange: (e) =>
																F((s) => ({
																	...s,
																	custom_category: e,
																})),
															onSearchChange: J,
															placeholder: "Search categories...",
														}),
													],
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "grid grid-cols-3 gap-2",
											children: [
												(0, a.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, a.jsx)(j.J, { children: "FRT" }),
														(0, a.jsx)(p.p, {
															value: M.custom_frt,
															onChange: (e) =>
																F((s) => ({
																	...s,
																	custom_frt: e.target.value,
																})),
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, a.jsx)(j.J, { children: "Cat code" }),
														(0, a.jsx)(p.p, {
															value: M.custom_cat_code,
															onChange: (e) =>
																F((s) => ({
																	...s,
																	custom_cat_code:
																		e.target.value,
																})),
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, a.jsx)(j.J, { children: "Sub code" }),
														(0, a.jsx)(p.p, {
															value: M.custom_sub_code,
															onChange: (e) =>
																F((s) => ({
																	...s,
																	custom_sub_code:
																		e.target.value,
																})),
														}),
													],
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "grid grid-cols-2 gap-2",
											children: [
												(0, a.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, a.jsx)(j.J, {
															children: "Estimated hours",
														}),
														(0, a.jsx)(p.p, {
															type: "text",
															inputMode: "decimal",
															value: M.custom_estimated_timehours,
															onChange: (e) =>
																F((s) => ({
																	...s,
																	custom_estimated_timehours:
																		e.target.value,
																})),
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, a.jsx)(j.J, {
															children: n ? "Rate" : "Rate (fixed)",
														}),
														(0, a.jsx)(p.p, {
															type: "text",
															inputMode: "decimal",
															value: M.custom_rate,
															onChange: (e) =>
																F((s) => ({
																	...s,
																	custom_rate: e.target.value,
																})),
															disabled: !n,
															className: n ? void 0 : "bg-muted",
														}),
													],
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-1",
											children: [
												(0, a.jsx)(j.J, { children: "Description" }),
												(0, a.jsx)(_.T, {
													rows: 3,
													value: M.custom_description,
													onChange: (e) =>
														F((s) => ({
															...s,
															custom_description: e.target.value,
														})),
												}),
											],
										}),
										t?.custom_erpnext_item
											? (0, a.jsxs)("p", {
													className: "text-xs text-muted-foreground",
													children: [
														"Linked Item: ",
														t.custom_erpnext_item,
													],
											  })
											: null,
									],
								}),
								(0, a.jsxs)(h.Es, {
									children: [
										(0, a.jsx)(x.$, {
											type: "button",
											variant: "outline",
											onClick: () => s(!1),
											children: "Cancel",
										}),
										(0, a.jsxs)(x.$, {
											type: "button",
											disabled: o,
											onClick: () => void B(),
											children: [
												o
													? (0, a.jsx)(m.A, {
															className: "mr-2 h-4 w-4 animate-spin",
													  })
													: null,
												"Save",
											],
										}),
									],
								}),
							],
						}),
					}),
				});
			}
			var w = t(33210);
			function C({ open: e, onOpenChange: s, serviceItem: t, onCreated: l }) {
				let [c, n] = (0, i.useState)(!1),
					[o, d] = (0, i.useState)(""),
					[u, v] = (0, i.useState)([]),
					p = (t?.custom_vehicle_model || "").trim(),
					{ data: _, isLoading: N } = (0, g.iR)(o),
					{ data: y } = (0, g.iR)((e && p) || void 0);
				(0, i.useEffect)(() => {
					e && (v([]), d(""));
				}, [e, t?.name]);
				let k = (0, i.useMemo)(() => {
						let e = [...(y || []), ...(_ || [])].find((e) => e.name === p);
						return (e?.model_code || "").trim();
					}, [p, y, _]),
					S = (0, i.useMemo)(() => {
						var e;
						let s,
							a,
							i =
								((e = t?.custom_service_code || ""),
								(s = (e || "").trim().toUpperCase()),
								(a = (k || "").trim().toUpperCase()),
								s
									? a && s.startsWith(a) && s.length > a.length
										? s.slice(a.length)
										: s
									: "");
						if (i) return i;
						let l = (t?.custom_cat_code || "").trim().toUpperCase(),
							r = (t?.custom_sub_code || "").trim();
						return `${l}${r}`;
					}, [t, k]),
					A = u
						.map((e) => {
							var s;
							let t, a;
							return (
								(s = e.modelCode),
								(t = S.trim().toUpperCase()),
								(a = (s || "").trim().toUpperCase()),
								!t || !a || t.startsWith(a) ? t : `${a}${t}`
							);
						})
						.filter(Boolean),
					$ = (_ || [])
						.filter((e) => e.name !== p && !u.some((s) => s.name === e.name))
						.map((e) => ({
							value: e.name,
							label: e.model_code || e.name,
							description:
								[e.model_name, e.variant].filter(Boolean).join(" ") || void 0,
						})),
					E = () => {
						c || s(!1);
					},
					J = async () => {
						let e = (t?.name || "").trim();
						if (!e) return void r.o.error("No service item selected");
						if (0 === u.length)
							return void r.o.error("Select at least one vehicle model");
						n(!0);
						try {
							let t = await b.qr(
									e,
									u.map((e) => e.name)
								),
								a = t.count || t.created?.length || 0,
								i = (t.created || [])
									.map((e) => e.custom_service_code)
									.filter(Boolean)
									.join(", ");
							r.o.success(
								a > 1
									? `Added ${a} models${i ? ` (${i})` : ""}`
									: `Service created${i ? ` as ${i}` : ""}`
							),
								l?.(),
								s(!1);
						} catch (e) {
							r.o.error(e instanceof Error ? e.message : "Failed to add model");
						} finally {
							n(!1);
						}
					},
					M = t?.custom_item_name || t?.service_item || "this service",
					F = t?.custom_service_code || "—";
				return (0, a.jsx)(h.lG, {
					open: e,
					onOpenChange: E,
					children: (0, a.jsxs)(h.Cf, {
						className: "sm:max-w-md",
						children: [
							(0, a.jsxs)(h.c7, {
								children: [
									(0, a.jsx)(h.L3, { children: "Add Model" }),
									(0, a.jsxs)(h.rr, {
										children: [
											"Create ",
											M,
											" for another vehicle model. The suffix from ",
											F,
											S ? ` (${S})` : "",
											" is combined with the new model code.",
										],
									}),
								],
							}),
							(0, a.jsxs)("div", {
								className: "space-y-3 py-2",
								children: [
									(0, a.jsxs)("div", {
										className: "space-y-2",
										children: [
											(0, a.jsxs)(j.J, {
												children: [
													"Vehicle Model ",
													(0, a.jsx)("span", {
														className: "text-destructive",
														children: "*",
													}),
												],
											}),
											(0, a.jsx)("div", {
												className:
													"flex min-h-10 flex-wrap gap-1.5 rounded-md border bg-background px-2 py-2",
												children:
													0 === u.length
														? (0, a.jsx)("span", {
																className:
																	"px-1 text-xs text-muted-foreground",
																children: "Select a vehicle model",
														  })
														: u.map((e) =>
																(0, a.jsxs)(
																	"span",
																	{
																		className:
																			"inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs",
																		children: [
																			e.label,
																			(0, a.jsx)("button", {
																				type: "button",
																				className:
																					"text-muted-foreground hover:text-foreground",
																				onClick: () =>
																					v((s) =>
																						s.filter(
																							(s) =>
																								s.name !==
																								e.name
																						)
																					),
																				"aria-label": `Remove ${e.label}`,
																				children: (0,
																				a.jsx)(w.A, {
																					className:
																						"h-3 w-3",
																				}),
																			}),
																		],
																	},
																	e.name
																)
														  ),
											}),
											(0, a.jsx)(f.Zi, {
												value: "",
												onValueChange: (e) => {
													let s = (_ || []).find((s) => s.name === e);
													s &&
														v((e) =>
															e.some((e) => e.name === s.name)
																? e
																: [
																		...e,
																		{
																			name: s.name,
																			modelCode: (
																				s.model_code || ""
																			).trim(),
																			label:
																				s.model_code ||
																				s.name,
																		},
																  ]
														);
												},
												onSearchChange: d,
												placeholder: "Search vehicle models...",
												isLoading: N,
												options: $,
												portaled: !0,
												keepOpenOnSelect: !0,
											}),
										],
									}),
									A.length > 0
										? (0, a.jsxs)("p", {
												className: "text-xs text-muted-foreground",
												children: ["Will create: ", A.join(", ")],
										  })
										: null,
								],
							}),
							(0, a.jsxs)(h.Es, {
								children: [
									(0, a.jsx)(x.$, {
										type: "button",
										variant: "outline",
										onClick: E,
										disabled: c,
										children: "Cancel",
									}),
									(0, a.jsxs)(x.$, {
										type: "button",
										onClick: () => void J(),
										disabled: c,
										children: [
											c
												? (0, a.jsx)(m.A, {
														className: "mr-2 h-4 w-4 animate-spin",
												  })
												: null,
											u.length > 1 ? `Add ${u.length} Models` : "Add Model",
										],
									}),
								],
							}),
						],
					}),
				});
			}
			var k = t(15664);
			function S({ open: e, onOpenChange: s, onUpdated: t }) {
				let { mutate: c } = (0, u.iX)(),
					{ canEditPrice: n } = (0, N.Sk)(),
					[o, d] = (0, i.useState)(!1),
					[v, _] = (0, i.useState)(""),
					[g, y] = (0, i.useState)(""),
					[w, C] = (0, i.useState)(""),
					[k, A] = (0, i.useState)(""),
					{ data: $, isLoading: E } = (0, l.Ay)(
						e ? ["vehicle-service-item-names", v] : null,
						() => b.xb({ search: v || void 0 })
					),
					J = (0, i.useMemo)(
						() =>
							($?.data || []).map((e) => ({
								value: e.service_item,
								label: e.service_item,
								description: `${e.code_count} code${
									1 === e.code_count ? "" : "s"
								}`,
							})),
						[$]
					),
					M = ($?.data || []).find((e) => e.service_item === g);
				(0, i.useEffect)(() => {
					e && (d(!1), _(""), y(""), C(""), A(""));
				}, [e]);
				let F = async () => {
					if (!g) return void r.o.error("Select the vehicle service item name");
					if (!w.trim() && !k.trim())
						return void r.o.error("Enter hours, rate, or both");
					d(!0);
					try {
						let e = await b.Jm({
							service_item: g,
							hours: w.trim() || null,
							rate: k.trim() || null,
						});
						await c(
							(e) =>
								Array.isArray(e) && String(e[0]).includes("vehicle-service-item"),
							void 0,
							{ revalidate: !0 }
						);
						let a = [
							null != e.hours ? `hours ${e.hours}` : null,
							null != e.rate ? `rate ${e.rate}` : null,
						]
							.filter(Boolean)
							.join(" \xb7 ");
						r.o.success(
							`Updated ${e.updated} code${1 === e.updated ? "" : "s"} of ${
								e.service_item
							}${a ? ` — ${a}` : ""}`
						),
							t?.(),
							s(!1);
					} catch (e) {
						r.o.error(
							e instanceof Error ? e.message : "Failed to bulk update service items"
						);
					} finally {
						d(!1);
					}
				};
				return (0, a.jsx)(h.lG, {
					open: e,
					onOpenChange: (e) => !o && s(e),
					children: (0, a.jsxs)(h.Cf, {
						className: "sm:max-w-md",
						children: [
							(0, a.jsxs)(h.c7, {
								children: [
									(0, a.jsx)(h.L3, { children: "Bulk Update Service Items" }),
									(0, a.jsx)(h.rr, {
										children:
											"Pick a service name and set hours and/or rate — every code of that name is updated, whichever vehicle model it belongs to.",
									}),
								],
							}),
							(0, a.jsxs)("div", {
								className: "grid gap-3 py-2",
								children: [
									(0, a.jsxs)("div", {
										className: "space-y-1",
										children: [
											(0, a.jsxs)(j.J, {
												children: [
													"Vehicle Service Item ",
													(0, a.jsx)("span", {
														className: "text-destructive",
														children: "*",
													}),
												],
											}),
											(0, a.jsx)(f.Zi, {
												options: J,
												value: g,
												onValueChange: y,
												onSearchChange: _,
												placeholder: "Search service name…",
												emptyMessage: "No service item name found",
												isLoading: E,
												portaled: !0,
											}),
											(0, a.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: M
													? `Updates all ${M.code_count} code${
															1 === M.code_count ? "" : "s"
													  } of this name.`
													: "The name is shared by every model; codes differ per model.",
											}),
										],
									}),
									(0, a.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [
											(0, a.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, a.jsx)(j.J, {
														children: "Estimated hours",
													}),
													(0, a.jsx)(p.p, {
														inputMode: "decimal",
														value: w,
														onChange: (e) => C(e.target.value),
														placeholder: "Leave blank to keep",
													}),
												],
											}),
											(0, a.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, a.jsx)(j.J, {
														children: n ? "Rate" : "Rate (fixed)",
													}),
													(0, a.jsx)(p.p, {
														inputMode: "decimal",
														value: k,
														onChange: (e) => A(e.target.value),
														placeholder: "Leave blank to keep",
														disabled: !n,
														className: n ? void 0 : "bg-muted",
													}),
												],
											}),
										],
									}),
									(0, a.jsxs)("p", {
										className: "text-xs text-muted-foreground",
										children: [
											"Blank fields keep their current values.",
											n ? "" : " Your role cannot change rates.",
										],
									}),
								],
							}),
							(0, a.jsxs)(h.Es, {
								children: [
									(0, a.jsx)(x.$, {
										type: "button",
										variant: "outline",
										onClick: () => s(!1),
										disabled: o,
										children: "Cancel",
									}),
									(0, a.jsxs)(x.$, {
										type: "button",
										onClick: () => void F(),
										disabled: o || !g,
										children: [
											o
												? (0, a.jsx)(m.A, {
														className: "mr-2 h-4 w-4 animate-spin",
												  })
												: null,
											"Update All Codes",
										],
									}),
								],
							}),
						],
					}),
				});
			}
			var A = t(33745),
				$ = t(93408),
				E = t(79984),
				J = t(38291),
				M = t(43447),
				F = t(83786),
				I = t(15306),
				U = t(33024),
				L = t(61878),
				Q = t(32967),
				B = t(51914),
				z = t(60285),
				V = t(7915),
				R = t(49387),
				O = t(13175),
				H = t(12651);
			function D(e) {
				return null == e || Number.isNaN(Number(e))
					? "—"
					: new Intl.NumberFormat("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
					  }).format(Number(e));
			}
			function P(e) {
				return e
					? (e.name || "").trim() ||
							(e.custom_service_code || "").trim() ||
							(e.custom_erpnext_item || "").trim() ||
							(e.service_item || "").trim()
					: "";
			}
			function T(e) {
				return (
					!!e && (null != e.custom_active ? 1 === Number(e.custom_active) : !e.disabled)
				);
			}
			function X() {
				let { canCreate: e, canWrite: s } = (0, N.Sk)(),
					t = e("vehicle-services"),
					u = s("vehicle-services"),
					h = s("vehicle-services"),
					[v, j] = (0, o.P)("vehicle-services", "search", ""),
					[_, f] = (0, i.useState)(v),
					[g, w] = (0, o.P)("vehicle-services", "active_filter", "active"),
					[X, Z] = (0, i.useState)(1),
					[Y, q] = (0, i.useState)(50),
					[W, G] = (0, i.useState)(null),
					[K, ee] = (0, i.useState)(!1),
					[es, et] = (0, i.useState)(null),
					[ea, ei] = (0, i.useState)(!1),
					[el, er] = (0, i.useState)(!1),
					[ec, en] = (0, i.useState)(null),
					[eo, ed] = (0, i.useState)(!1),
					[em, eu] = (0, i.useState)(null);
				(0, i.useEffect)(() => {
					let e = window.setTimeout(() => f(v.trim()), 250);
					return () => window.clearTimeout(e);
				}, [v]),
					(0, i.useEffect)(() => {
						Z(1);
					}, [_, g]);
				let {
						data: eh,
						isLoading: ex,
						error: ev,
						mutate: ep,
					} = (0, l.Ay)(["vehicle-service-items-master", _, g, X, Y], () =>
						b.YM({
							search: _ || void 0,
							active_filter: g,
							limit: Y,
							offset: (X - 1) * Y,
						})
					),
					{
						data: ej,
						isLoading: e_,
						mutate: ef,
					} = (0, l.Ay)(W ? ["vehicle-service-item", W] : null, () => b.nY(W)),
					eg = eh?.total || 0,
					{
						items: eb,
						loadedCount: eN,
						isLoadingMore: ey,
						loadMore: ew,
					} = (0, n.h)({
						items: eh?.data,
						total: eg,
						offset: (X - 1) * Y,
						resetKey: [_, g, X, Y].join("|"),
						enabled: Y >= n.J,
						fetchMore: async (e, s) =>
							(
								await b.YM({
									search: _ || void 0,
									active_filter: g,
									limit: s,
									offset: e,
								})
							).data,
					});
				function eC(e) {
					let s = P(e);
					G(s || null), et({ ...e, name: s || e.name }), ee(!0);
				}
				function ek(e) {
					let s = P(e);
					en({ ...e, name: s || e.name }), er(!0);
				}
				async function eS(e) {
					if (!u) return;
					let s = P(e);
					if (!s) return void r.o.error("Cannot identify this service item");
					let t = +!T(e);
					eu(s);
					try {
						await b.Qn(s, { custom_active: t }),
							r.o.success(t ? "Service enabled" : "Service disabled"),
							ep(),
							W === s && ef();
					} catch (e) {
						r.o.error(e instanceof Error ? e.message : "Failed to update status");
					} finally {
						eu(null);
					}
				}
				return (0, a.jsxs)("div", {
					className: "min-w-0 space-y-4 sm:space-y-6",
					children: [
						(0, a.jsxs)("div", {
							className:
								"flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
							children: [
								(0, a.jsxs)("div", {
									children: [
										(0, a.jsx)("h1", {
											className: "dms-stat-value text-xl tracking-tight",
											children: "Services",
										}),
										(0, a.jsx)("p", {
											className: "text-muted-foreground",
											children: "Vehicle service / labour item masters",
										}),
									],
								}),
								(0, a.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										h
											? (0, a.jsxs)(x.$, {
													type: "button",
													variant: "outline",
													"aria-label": "Bulk update",
													title: "Bulk update hours / rate for every code of a service name",
													onClick: () => ed(!0),
													children: [
														(0, a.jsx)(U.A, {
															className: "h-4 w-4 shrink-0",
														}),
														(0, a.jsx)("span", {
															className: "hidden sm:ml-2 sm:inline",
															children: "Bulk Update",
														}),
													],
											  })
											: null,
										(0, a.jsx)(A.l, {
											module: "vehicle-services",
											label: "New Service Item",
											onClick: () => ei(!0),
										}),
									],
								}),
							],
						}),
						(0, a.jsx)(E.Zp, {
							children: (0, a.jsxs)(E.Wu, {
								className: "pt-6 space-y-4",
								children: [
									(0, a.jsxs)("div", {
										className:
											"flex flex-col gap-3 sm:flex-row sm:items-center",
										children: [
											(0, a.jsxs)("div", {
												className: "relative flex-1",
												children: [
													(0, a.jsx)(L.A, {
														className:
															"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
													}),
													(0, a.jsx)(p.p, {
														className: "pl-9",
														placeholder:
															"Search service name, code, FRT…",
														value: v,
														onChange: (e) => j(e.target.value),
													}),
												],
											}),
											(0, a.jsx)(I.tU, {
												value: g,
												onValueChange: (e) => w(e),
												className: "w-full sm:w-auto",
												children: (0, a.jsxs)(I.j7, {
													className: "w-full sm:w-auto",
													children: [
														(0, a.jsx)(I.Xi, {
															value: "active",
															className: "flex-1 sm:flex-none",
															children: "Active",
														}),
														(0, a.jsx)(I.Xi, {
															value: "all",
															className: "flex-1 sm:flex-none",
															children: "All",
														}),
														(0, a.jsx)(I.Xi, {
															value: "inactive",
															className: "flex-1 sm:flex-none",
															children: "Inactive",
														}),
													],
												}),
											}),
										],
									}),
									ex
										? (0, a.jsx)("div", {
												className: "flex justify-center py-12",
												children: (0, a.jsx)(m.A, {
													className:
														"h-6 w-6 animate-spin text-muted-foreground",
												}),
										  })
										: ev
										? (0, a.jsx)("p", {
												className:
													"text-sm text-destructive py-8 text-center",
												children:
													ev.message || "Failed to load service items",
										  })
										: 0 === eb.length
										? (0, a.jsxs)("div", {
												className:
													"flex flex-col items-center py-12 text-muted-foreground",
												children: [
													(0, a.jsx)(Q.A, {
														className: "h-10 w-10 mb-2 opacity-40",
													}),
													(0, a.jsx)("p", {
														className: "text-sm",
														children: "No service items found",
													}),
												],
										  })
										: (0, a.jsx)("div", {
												className: "overflow-x-auto rounded-md border",
												children: (0, a.jsxs)(F.XI, {
													children: [
														(0, a.jsx)(F.A0, {
															children: (0, a.jsxs)(F.Hj, {
																children: [
																	(0, a.jsx)(F.nd, {
																		children: "Service",
																	}),
																	(0, a.jsx)(F.nd, {
																		children: "Code",
																	}),
																	(0, a.jsx)(F.nd, {
																		children: "Model",
																	}),
																	(0, a.jsx)(F.nd, {
																		children: "Hours",
																	}),
																	(0, a.jsx)(F.nd, {
																		className: "text-right",
																		children: "Rate",
																	}),
																	(0, a.jsx)(F.nd, {
																		children: "Status",
																	}),
																	(0, a.jsx)(F.nd, {
																		className:
																			"w-[1%] text-right",
																		children: "Actions",
																	}),
																],
															}),
														}),
														(0, a.jsx)(F.BF, {
															children: eb.map((e, s) => {
																let i = P(e) || `row-${s}`;
																return (0, a.jsxs)(
																	F.Hj,
																	{
																		className:
																			"cursor-pointer",
																		onClick: () =>
																			G(P(e) || null),
																		children: [
																			(0, a.jsxs)(F.nA, {
																				children: [
																					(0, a.jsx)(
																						"div",
																						{
																							className:
																								"font-medium",
																							children:
																								e.service_item ||
																								e.custom_item_name ||
																								e.name,
																						}
																					),
																					e.custom_erpnext_item
																						? (0,
																						  a.jsx)(
																								"div",
																								{
																									className:
																										"text-xs text-muted-foreground",
																									children:
																										e.custom_erpnext_item,
																								}
																						  )
																						: null,
																				],
																			}),
																			(0, a.jsx)(F.nA, {
																				className:
																					"text-sm",
																				children:
																					e.custom_service_code ||
																					e.custom_frt ||
																					"—",
																			}),
																			(0, a.jsx)(F.nA, {
																				className:
																					"text-sm",
																				children:
																					e.custom_vehicle_model ||
																					"—",
																			}),
																			(0, a.jsx)(F.nA, {
																				className:
																					"text-sm tabular-nums",
																				children:
																					e.custom_estimated_timehours ??
																					"—",
																			}),
																			(0, a.jsx)(F.nA, {
																				className:
																					"text-right tabular-nums",
																				children: D(
																					e.custom_rate
																				),
																			}),
																			(0, a.jsx)(F.nA, {
																				children: T(e)
																					? (0, a.jsx)(
																							J.E,
																							{
																								variant:
																									"secondary",
																								children:
																									"Active",
																							}
																					  )
																					: (0, a.jsx)(
																							J.E,
																							{
																								variant:
																									"outline",
																								className:
																									"text-muted-foreground",
																								children:
																									"Inactive",
																							}
																					  ),
																			}),
																			(0, a.jsx)(F.nA, {
																				onClick: (e) =>
																					e.stopPropagation(),
																				children: (0,
																				a.jsxs)($.m, {
																					doctype:
																						"Vehicle Service Item",
																					docName: P(e),
																					showPrint: !1,
																					children: [
																						t
																							? (0,
																							  a.jsxs)(
																									x.$,
																									{
																										type: "button",
																										variant:
																											"outline",
																										size: "sm",
																										className:
																											"h-8",
																										onClick:
																											() =>
																												ek(
																													e
																												),
																										children:
																											[
																												(0,
																												a.jsx)(
																													B.A,
																													{
																														className:
																															"h-3.5 w-3.5",
																													}
																												),
																												"Add Model",
																											],
																									}
																							  )
																							: null,
																						(0,
																						a.jsxs)(
																							M.rI,
																							{
																								children:
																									[
																										(0,
																										a.jsx)(
																											M.ty,
																											{
																												asChild:
																													!0,
																												children:
																													(0,
																													a.jsx)(
																														x.$,
																														{
																															variant:
																																"ghost",
																															size: "icon",
																															className:
																																"h-8 w-8 shrink-0",
																															disabled:
																																em ===
																																P(
																																	e
																																),
																															children:
																																em ===
																																P(
																																	e
																																)
																																	? (0,
																																	  a.jsx)(
																																			m.A,
																																			{
																																				className:
																																					"h-4 w-4 animate-spin",
																																			}
																																	  )
																																	: (0,
																																	  a.jsx)(
																																			z.A,
																																			{
																																				className:
																																					"h-4 w-4",
																																			}
																																	  ),
																														}
																													),
																											}
																										),
																										(0,
																										a.jsxs)(
																											M.SQ,
																											{
																												align: "end",
																												children:
																													[
																														(0,
																														a.jsxs)(
																															M._2,
																															{
																																onClick:
																																	() =>
																																		G(
																																			P(
																																				e
																																			) ||
																																				null
																																		),
																																children:
																																	[
																																		(0,
																																		a.jsx)(
																																			V.A,
																																			{
																																				className:
																																					"mr-2 h-4 w-4",
																																			}
																																		),
																																		"View Details",
																																	],
																															}
																														),
																														t
																															? (0,
																															  a.jsxs)(
																																	M._2,
																																	{
																																		onClick:
																																			() =>
																																				ek(
																																					e
																																				),
																																		children:
																																			[
																																				(0,
																																				a.jsx)(
																																					B.A,
																																					{
																																						className:
																																							"mr-2 h-4 w-4",
																																					}
																																				),
																																				"Add Model",
																																			],
																																	}
																															  )
																															: null,
																														(0,
																														a.jsxs)(
																															M._2,
																															{
																																onClick:
																																	() =>
																																		eC(
																																			e
																																		),
																																children:
																																	[
																																		(0,
																																		a.jsx)(
																																			R.A,
																																			{
																																				className:
																																					"mr-2 h-4 w-4",
																																			}
																																		),
																																		"Edit",
																																	],
																															}
																														),
																														u
																															? (0,
																															  a.jsx)(
																																	M._2,
																																	{
																																		className:
																																			T(
																																				e
																																			)
																																				? "text-destructive focus:text-destructive"
																																				: void 0,
																																		onClick:
																																			() =>
																																				void eS(
																																					e
																																				),
																																		children:
																																			T(
																																				e
																																			)
																																				? (0,
																																				  a.jsxs)(
																																						a.Fragment,
																																						{
																																							children:
																																								[
																																									(0,
																																									a.jsx)(
																																										O.A,
																																										{
																																											className:
																																												"mr-2 h-4 w-4",
																																										}
																																									),
																																									"Disable",
																																								],
																																						}
																																				  )
																																				: (0,
																																				  a.jsxs)(
																																						a.Fragment,
																																						{
																																							children:
																																								[
																																									(0,
																																									a.jsx)(
																																										H.A,
																																										{
																																											className:
																																												"mr-2 h-4 w-4",
																																										}
																																									),
																																									"Enable",
																																								],
																																						}
																																				  ),
																																	}
																															  )
																															: null,
																													],
																											}
																										),
																									],
																							}
																						),
																					],
																				}),
																			}),
																		],
																	},
																	i
																);
															}),
														}),
													],
												}),
										  }),
									(0, a.jsx)(c.$, {
										page: X,
										pageSize: Y,
										totalItems: eg,
										loadedCount: eN,
										onPageChange: Z,
										onPageSizeChange: q,
										onLoadMore: ew,
										isLoadingMore: ey,
									}),
								],
							}),
						}),
						(0, a.jsx)(d.BN, {
							open: !!W && !K,
							onOpenChange: (e) => !e && G(null),
							title: ej?.service_item || W || "Service Item",
							subtitle: ej?.custom_service_code || ej?.name,
							footer: (0, a.jsxs)("div", {
								className: "flex flex-col gap-2 sm:flex-row sm:justify-end",
								children: [
									t && (ej || es)
										? (0, a.jsxs)(x.$, {
												variant: "outline",
												className: "w-full sm:w-auto",
												onClick: () => ek(ej || es),
												children: [
													(0, a.jsx)(B.A, { className: "h-4 w-4 mr-2" }),
													"Add Model",
												],
										  })
										: null,
									(0, a.jsxs)(x.$, {
										className: "w-full sm:w-auto",
										onClick: () => eC(ej || es || { name: W || "" }),
										children: [
											(0, a.jsx)(R.A, { className: "h-4 w-4 mr-2" }),
											"Edit",
										],
									}),
									u && (ej || es)
										? (0, a.jsx)(x.$, {
												variant: "outline",
												className: "w-full sm:w-auto",
												onClick: () => void eS(ej || es),
												children: T(ej || es) ? "Disable" : "Enable",
										  })
										: null,
								],
							}),
							children: e_
								? (0, a.jsx)("div", {
										className: "flex justify-center py-8",
										children: (0, a.jsx)(m.A, {
											className:
												"h-5 w-5 animate-spin text-muted-foreground",
										}),
								  })
								: ej
								? (0, a.jsxs)(a.Fragment, {
										children: [
											(0, a.jsxs)(d.JH, {
												title: "Service",
												children: [
													(0, a.jsx)(d.Qb, {
														label: "Name",
														value: ej.service_item,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Code",
														value: ej.custom_service_code,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Linked Item",
														value: ej.custom_erpnext_item,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Status",
														value: T(ej) ? "Active" : "Inactive",
													}),
												],
											}),
											(0, a.jsxs)(d.JH, {
												title: "Classification",
												children: [
													(0, a.jsx)(d.Qb, {
														label: "Vehicle model",
														value: ej.custom_vehicle_model,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Category",
														value: ej.custom_category,
													}),
													(0, a.jsx)(d.Qb, {
														label: "FRT",
														value: ej.custom_frt,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Cat / Sub",
														value:
															[
																ej.custom_cat_code,
																ej.custom_sub_code,
															]
																.filter(Boolean)
																.join(" / ") || void 0,
													}),
												],
											}),
											(0, a.jsxs)(d.JH, {
												title: "Pricing",
												children: [
													(0, a.jsx)(d.Qb, {
														label: "Hours",
														value:
															null != ej.custom_estimated_timehours
																? String(
																		ej.custom_estimated_timehours
																  )
																: void 0,
													}),
													(0, a.jsx)(d.Qb, {
														label: "Rate",
														value: D(ej.custom_rate),
													}),
													(0, a.jsx)(d.Qb, {
														label: "Item price",
														value: ej.item_price
															? `${D(
																	ej.item_price.price_list_rate
															  )} (${ej.item_price.price_list})`
															: void 0,
													}),
												],
											}),
											(0, a.jsx)(d.JH, {
												title: "Description",
												children: (0, a.jsx)(d.Qb, {
													label: "Notes",
													value: ej.custom_description,
												}),
											}),
										],
								  })
								: null,
						}),
						(0, a.jsx)(y, {
							open: K,
							onOpenChange: (e) => {
								ee(e), e || et(null);
							},
							serviceItem: es && ej && ej.name === es.name ? ej : es || ej || null,
							onUpdated: () => {
								ep(), ef();
							},
						}),
						(0, a.jsx)(C, {
							open: el,
							onOpenChange: (e) => {
								er(e), e || en(null);
							},
							serviceItem: ec && ej && ej.name === ec.name ? ej : ec,
							onCreated: () => {
								ep(), ef();
							},
						}),
						(0, a.jsx)(k.B, {
							open: ea,
							onOpenChange: ei,
							onCreated: () => {
								ep();
							},
						}),
						(0, a.jsx)(S, {
							open: eo,
							onOpenChange: ed,
							onUpdated: () => {
								ep(), ef();
							},
						}),
					],
				});
			}
		},
		61991: (e, s, t) => {
			t.d(s, { w: () => r });
			var a = t(95155);
			t(12115);
			var i = t(89803),
				l = t(91337);
			function r({ className: e, orientation: s = "horizontal", decorative: t = !0, ...c }) {
				return (0, a.jsx)(i.b, {
					"data-slot": "separator",
					decorative: t,
					orientation: s,
					className: (0, l.cn)(
						"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
						e
					),
					...c,
				});
			}
		},
		84437: (e, s, t) => {
			t.d(s, { S: () => c });
			var a = t(95155);
			t(12115);
			var i = t(47279),
				l = t(94514),
				r = t(91337);
			function c({ className: e, ...s }) {
				return (0, a.jsx)(i.bL, {
					"data-slot": "checkbox",
					className: (0, r.cn)(
						"peer border-input dark:bg-input/30 data-[state=checked]:bg-dms-green data-[state=checked]:text-white dark:data-[state=checked]:bg-dms-green data-[state=checked]:border-dms-green focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 cursor-pointer rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
						e
					),
					...s,
					children: (0, a.jsx)(i.C1, {
						"data-slot": "checkbox-indicator",
						className: "flex items-center justify-center text-current transition-none",
						children: (0, a.jsx)(l.A, { className: "size-3.5" }),
					}),
				});
			}
		},
		98883: (e, s, t) => {
			t.d(s, { Qb: () => f, JH: () => _, BN: () => j });
			var a = t(95155);
			t(12115);
			var i = t(29483),
				l = t(33210),
				r = t(91337);
			function c({ ...e }) {
				return (0, a.jsx)(i.bL, { "data-slot": "sheet", ...e });
			}
			function n({ ...e }) {
				return (0, a.jsx)(i.ZL, { "data-slot": "sheet-portal", ...e });
			}
			function o({ className: e, ...s }) {
				return (0, a.jsx)(i.hJ, {
					"data-slot": "sheet-overlay",
					className: (0, r.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...s,
				});
			}
			function d({ className: e, children: s, side: t = "right", ...c }) {
				return (0, a.jsxs)(n, {
					children: [
						(0, a.jsx)(o, {}),
						(0, a.jsxs)(i.UC, {
							"data-slot": "sheet-content",
							className: (0, r.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
								"right" === t &&
									"data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
								"left" === t &&
									"data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
								"top" === t &&
									"data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
								"bottom" === t &&
									"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
								e
							),
							...c,
							children: [
								s,
								(0, a.jsxs)(i.bm, {
									className:
										"ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
									children: [
										(0, a.jsx)(l.A, { className: "size-4" }),
										(0, a.jsx)("span", {
											className: "sr-only",
											children: "Close",
										}),
									],
								}),
							],
						}),
					],
				});
			}
			function m({ className: e, ...s }) {
				return (0, a.jsx)("div", {
					"data-slot": "sheet-header",
					className: (0, r.cn)("flex flex-col gap-1.5 p-4", e),
					...s,
				});
			}
			function u({ className: e, ...s }) {
				return (0, a.jsx)(i.hE, {
					"data-slot": "sheet-title",
					className: (0, r.cn)("text-foreground font-semibold", e),
					...s,
				});
			}
			function h({ className: e, ...s }) {
				return (0, a.jsx)(i.VY, {
					"data-slot": "sheet-description",
					className: (0, r.cn)("text-muted-foreground text-sm", e),
					...s,
				});
			}
			var x = t(38291),
				v = t(61991),
				p = t(6296);
			function j({
				open: e,
				onOpenChange: s,
				title: t,
				subtitle: i,
				badge: l,
				isLoading: n,
				onOpenInDesk: o,
				footer: _,
				contentScroll: f = "outer",
				children: g,
			}) {
				return (0, a.jsx)(c, {
					open: e,
					onOpenChange: s,
					children: (0, a.jsxs)(d, {
						side: "right",
						className:
							"flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l-2 border-l-dms-green p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
						children: [
							(0, a.jsx)(m, {
								className: "shrink-0 bg-dms-green-light px-4 pt-4 pb-3",
								children: (0, a.jsx)("div", {
									className:
										"flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between",
									children: (0, a.jsxs)("div", {
										className: "min-w-0",
										children: [
											(0, a.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													(0, a.jsx)(u, {
														className: "text-lg",
														children: t,
													}),
													l &&
														(0, a.jsx)(x.E, {
															variant: l.variant || "secondary",
															className:
																"bg-dms-green text-white border-dms-green",
															children: l.label,
														}),
												],
											}),
											i && (0, a.jsx)(h, { className: "mt-1", children: i }),
										],
									}),
								}),
							}),
							(0, a.jsx)(v.w, { className: "bg-(--dms-green)/20" }),
							n
								? (0, a.jsx)("div", {
										className: "flex items-center justify-center py-20",
										children: (0, a.jsx)(p.A, {
											className: "h-6 w-6 animate-spin text-dms-green",
										}),
								  })
								: (0, a.jsxs)(a.Fragment, {
										children: [
											(0, a.jsx)("div", {
												className: (0, r.cn)(
													"flex min-h-0 flex-1 flex-col px-4 pb-4",
													"inner" === f
														? "overflow-hidden"
														: "overflow-y-auto"
												),
												children: g,
											}),
											_ &&
												(0, a.jsx)("div", {
													className:
														"shrink-0 border-t bg-background px-4 py-3",
													children: _,
												}),
										],
								  }),
						],
					}),
				});
			}
			function _({ title: e, children: s, className: t }) {
				return (0, a.jsxs)("div", {
					className: (0, r.cn)("space-y-2", t),
					children: [
						(0, a.jsxs)("h3", {
							className:
								"text-sm font-semibold text-dms-green uppercase tracking-wider flex items-center gap-2",
							children: [
								(0, a.jsx)("span", {
									className: "w-1 h-4 rounded-full bg-dms-green",
								}),
								e,
							],
						}),
						(0, a.jsx)("div", {
							className:
								"rounded-lg border border-(--dms-green)/15 bg-card p-3 space-y-3",
							children: s,
						}),
					],
				});
			}
			function f({ label: e, value: s, className: t }) {
				return (0, a.jsxs)("div", {
					className: (0, r.cn)(
						"flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
						t
					),
					children: [
						(0, a.jsx)("span", {
							className: "text-sm text-muted-foreground",
							children: e,
						}),
						(0, a.jsx)("span", {
							className: "text-sm font-medium sm:text-right",
							children: s || "—",
						}),
					],
				});
			}
		},
	},
]);
