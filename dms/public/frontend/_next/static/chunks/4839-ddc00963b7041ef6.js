"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[4839],
	{
		12651: (e, s, t) => {
			t.d(s, { A: () => a });
			let a = (0, t(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, s, t) => {
			t.d(s, { A: () => a });
			let a = (0, t(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		14278: (e, s, t) => {
			t.d(s, { Ke: () => n, Nt: () => l, R6: () => i });
			var a = t(95155),
				r = t(19820);
			function l({ ...e }) {
				return (0, a.jsx)(r.bL, { "data-slot": "collapsible", ...e });
			}
			function i({ ...e }) {
				return (0, a.jsx)(r.R6, { "data-slot": "collapsible-trigger", ...e });
			}
			function n({ ...e }) {
				return (0, a.jsx)(r.Ke, { "data-slot": "collapsible-content", ...e });
			}
		},
		19820: (e, s, t) => {
			t.d(s, { Ke: () => N, R6: () => j, bL: () => k });
			var a = t(12115),
				r = t(70379),
				l = t(68599),
				i = t(98979),
				n = t(66294),
				o = t(47527),
				d = t(99354),
				c = t(83935),
				m = t(89971),
				u = t(95155),
				p = "Collapsible",
				[x, h] = (0, l.A)(p),
				[g, y] = x(p),
				b = a.forwardRef((e, s) => {
					let {
							__scopeCollapsible: t,
							open: r,
							defaultOpen: l,
							disabled: n,
							onOpenChange: o,
							...c
						} = e,
						[x, h] = (0, i.i)({
							prop: r,
							defaultProp: l ?? !1,
							onChange: o,
							caller: p,
						});
					return (0, u.jsx)(g, {
						scope: t,
						disabled: n,
						contentId: (0, m.B)(),
						open: x,
						onOpenToggle: a.useCallback(() => h((e) => !e), [h]),
						children: (0, u.jsx)(d.sG.div, {
							"data-state": C(x),
							"data-disabled": n ? "" : void 0,
							...c,
							ref: s,
						}),
					});
				});
			b.displayName = p;
			var f = "CollapsibleTrigger",
				j = a.forwardRef((e, s) => {
					let { __scopeCollapsible: t, ...a } = e,
						l = y(f, t);
					return (0, u.jsx)(d.sG.button, {
						type: "button",
						"aria-controls": l.contentId,
						"aria-expanded": l.open || !1,
						"data-state": C(l.open),
						"data-disabled": l.disabled ? "" : void 0,
						disabled: l.disabled,
						...a,
						ref: s,
						onClick: (0, r.mK)(e.onClick, l.onOpenToggle),
					});
				});
			j.displayName = f;
			var v = "CollapsibleContent",
				N = a.forwardRef((e, s) => {
					let { forceMount: t, ...a } = e,
						r = y(v, e.__scopeCollapsible);
					return (0, u.jsx)(c.C, {
						present: t || r.open,
						children: ({ present: e }) => (0, u.jsx)(_, { ...a, ref: s, present: e }),
					});
				});
			N.displayName = v;
			var _ = a.forwardRef((e, s) => {
				let { __scopeCollapsible: t, present: r, children: l, ...i } = e,
					c = y(v, t),
					[m, p] = a.useState(r),
					x = a.useRef(null),
					h = (0, o.s)(s, x),
					g = a.useRef(0),
					b = g.current,
					f = a.useRef(0),
					j = f.current,
					N = c.open || m,
					_ = a.useRef(N),
					k = a.useRef(void 0);
				return (
					a.useEffect(() => {
						let e = requestAnimationFrame(() => (_.current = !1));
						return () => cancelAnimationFrame(e);
					}, []),
					(0, n.N)(() => {
						let e = x.current;
						if (e) {
							(k.current = k.current || {
								transitionDuration: e.style.transitionDuration,
								animationName: e.style.animationName,
							}),
								(e.style.transitionDuration = "0s"),
								(e.style.animationName = "none");
							let s = e.getBoundingClientRect();
							(g.current = s.height),
								(f.current = s.width),
								_.current ||
									((e.style.transitionDuration = k.current.transitionDuration),
									(e.style.animationName = k.current.animationName)),
								p(r);
						}
					}, [c.open, r]),
					(0, u.jsx)(d.sG.div, {
						"data-state": C(c.open),
						"data-disabled": c.disabled ? "" : void 0,
						id: c.contentId,
						hidden: !N,
						...i,
						ref: h,
						style: {
							"--radix-collapsible-content-height": b ? `${b}px` : void 0,
							"--radix-collapsible-content-width": j ? `${j}px` : void 0,
							...e.style,
						},
						children: N && l,
					})
				);
			});
			function C(e) {
				return e ? "open" : "closed";
			}
			var k = b;
		},
		42074: (e, s, t) => {
			t.d(s, { h: () => n });
			var a = t(95155),
				r = t(12115),
				l = t(47650),
				i = t(91337);
			function n({ children: e, className: s, align: t = "end" }) {
				let [o, d] = (0, r.useState)(!1);
				(0, r.useEffect)(() => (d(!0), () => d(!1)), []);
				let c = (0, a.jsx)("div", {
					role: "toolbar",
					"aria-label": "Form actions",
					className: (0, i.cn)(
						"fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_24px_rgba(15,61,94,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-card/90",
						"pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3",
						"lg:left-64",
						s
					),
					children: (0, a.jsx)("div", {
						className: (0, i.cn)(
							"mx-auto w-full max-w-[1600px] px-3 sm:px-4 lg:px-6",
							"between" === t
								? "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3"
								: "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3"
						),
						children: e,
					}),
				});
				return o ? (0, l.createPortal)(c, document.body) : null;
			}
		},
		54839: (e, s, t) => {
			t.r(s), t.d(s, { default: () => f });
			var a = t(95155),
				r = t(12115),
				l = t(44855),
				i = t(32144),
				n = t(55833),
				o = t(4474),
				d = t(79984),
				c = t(39658),
				m = t(42074),
				u = t(10086),
				p = t(56728),
				x = t(93108),
				h = t(14278),
				g = t(66088),
				y = t(6296),
				b = t(91337);
			function f() {
				let { navigate: e } = (0, n.c)(),
					{ data: s, isLoading: t } = (0, l.Ay)("crm-customer-create-options", i.$I),
					[f, j] = (0, r.useState)(!1),
					[v, N] = (0, r.useState)(!1),
					{ error: _, success: C, showError: k, clear: w } = (0, x.B)(),
					[S, A] = (0, r.useState)([]),
					[R, B] = (0, r.useState)({
						customer_name: "",
						customer_type: "Individual",
						customer_group: "",
						mobile_no: "",
						email_id: "",
						territory: "",
						tax_id: "",
						website: "",
					}),
					[Z, M] = (0, r.useState)({
						address_type: "Billing",
						address_line1: "",
						address_line2: "",
						city: "",
						state: "",
						pincode: "",
						country: "",
					});
				(0, r.useEffect)(() => {
					s &&
						(B((e) => ({
							...e,
							customer_group: e.customer_group || s.default_customer_group || "",
							customer_type:
								e.customer_type || s.customer_types?.[0] || "Individual",
						})),
						M((e) => ({
							...e,
							country: e.country || s.default_country || "",
							address_type: e.address_type || s.address_types?.[0] || "Billing",
						})));
				}, [s]);
				let L = (0, r.useMemo)(
						() =>
							(s?.customer_types || ["Individual", "Company"]).map((e) => ({
								value: e,
								label: e,
							})),
						[s]
					),
					T = (0, r.useMemo)(
						() => (s?.customer_groups || []).map((e) => ({ value: e, label: e })),
						[s]
					),
					$ = (0, r.useMemo)(
						() => (s?.countries || []).map((e) => ({ value: e, label: e })),
						[s]
					),
					D = (0, r.useMemo)(
						() =>
							(
								s?.address_types || ["Billing", "Shipping", "Office", "Personal"]
							).map((e) => ({ value: e, label: e })),
						[s]
					),
					I = (e, s) => B((t) => ({ ...t, [e]: s })),
					E = (e, s) => M((t) => ({ ...t, [e]: s })),
					O =
						!!Z.address_line1.trim() ||
						!!Z.city.trim() ||
						!!Z.address_line2.trim() ||
						!!Z.state.trim() ||
						!!Z.pincode.trim(),
					P = async (s = !1) => {
						if ((w(), !R.customer_name.trim()))
							return void k("Customer name is required.");
						if (!R.customer_group) return void k("Select a DMS customer group.");
						if (
							O &&
							(!Z.address_line1.trim() || !Z.city.trim() || !Z.country.trim())
						) {
							N(!0),
								k(
									"Address needs line 1, city and country (or clear the address fields)."
								);
							return;
						}
						j(!0);
						try {
							let t = {
								customer_name: R.customer_name.trim(),
								customer_type: R.customer_type,
								customer_group: R.customer_group,
								mobile_no: R.mobile_no.trim() || void 0,
								email_id: R.email_id.trim() || void 0,
								territory: R.territory || void 0,
								tax_id: R.tax_id.trim() || void 0,
								website: R.website.trim() || void 0,
							};
							O &&
								(t.address = {
									address_type: Z.address_type || "Billing",
									address_line1: Z.address_line1.trim(),
									address_line2: Z.address_line2.trim() || void 0,
									city: Z.city.trim(),
									state: Z.state.trim() || void 0,
									pincode: Z.pincode.trim() || void 0,
									country: Z.country.trim(),
								});
							let a = await (0, i.ff)(t, s);
							if (a?.error === "possible_duplicates") {
								A(a.duplicates || []),
									k(a.message, "Possible duplicate customers found.");
								return;
							}
							let r = a?.name;
							r ? e("crm-customer-detail", { id: r }) : e("crm-customers");
						} catch (e) {
							k(e, "Failed to create customer");
						} finally {
							j(!1);
						}
					};
				return (0, a.jsxs)("div", {
					className: "dms-form-page space-y-4",
					children: [
						(0, a.jsx)(x.y, { error: _, success: C, onDismiss: w }),
						(0, a.jsxs)(d.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, a.jsx)(d.aR, {
									children: (0, a.jsx)(d.ZB, {
										className: "text-base",
										children: "Customer details",
									}),
								}),
								(0, a.jsxs)(d.Wu, {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										(0, a.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Customer name",
												}),
												(0, a.jsx)(c.p, {
													value: R.customer_name,
													onChange: (e) =>
														I("customer_name", e.target.value),
													placeholder: "Legal or display name",
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Type",
												}),
												(0, a.jsx)(u.Zi, {
													options: L,
													value: R.customer_type,
													onValueChange: (e) =>
														I("customer_type", e || "Individual"),
													placeholder: "Select type…",
													isLoading: t,
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Customer group",
												}),
												(0, a.jsx)(u.Zi, {
													options: T,
													value: R.customer_group,
													onValueChange: (e) => I("customer_group", e),
													placeholder: "Search customer group…",
													emptyMessage:
														"No DMS customer groups configured",
													isLoading: t,
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Mobile",
												}),
												(0, a.jsx)(c.p, {
													value: R.mobile_no,
													onChange: (e) =>
														I("mobile_no", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Email",
												}),
												(0, a.jsx)(c.p, {
													type: "email",
													value: R.email_id,
													onChange: (e) => I("email_id", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Territory",
												}),
												(0, a.jsx)(p.r, {
													value: R.territory,
													onValueChange: (e) => I("territory", e),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Tax ID",
												}),
												(0, a.jsx)(c.p, {
													value: R.tax_id,
													onChange: (e) => I("tax_id", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Website",
												}),
												(0, a.jsx)(c.p, {
													value: R.website,
													onChange: (e) => I("website", e.target.value),
												}),
											],
										}),
									],
								}),
							],
						}),
						(0, a.jsx)(d.Zp, {
							className: "border-border/70 shadow-sm",
							children: (0, a.jsxs)(h.Nt, {
								open: v,
								onOpenChange: N,
								children: [
									(0, a.jsx)(d.aR, {
										className: "pb-3",
										children: (0, a.jsx)(h.R6, {
											asChild: !0,
											children: (0, a.jsxs)("button", {
												type: "button",
												className:
													"flex w-full items-center justify-between text-left",
												children: [
													(0, a.jsxs)("div", {
														children: [
															(0, a.jsx)(d.ZB, {
																className: "text-base",
																children: "Address",
															}),
															(0, a.jsxs)("p", {
																className:
																	"mt-0.5 text-xs text-muted-foreground",
																children: [
																	"Optional primary billing / shipping address",
																	O
																		? " \xb7 details entered"
																		: "",
																],
															}),
														],
													}),
													(0, a.jsx)(g.A, {
														className: (0, b.cn)(
															"h-4 w-4 shrink-0 text-muted-foreground transition-transform",
															v && "rotate-180"
														),
													}),
												],
											}),
										}),
									}),
									(0, a.jsx)(h.Ke, {
										children: (0, a.jsxs)(d.Wu, {
											className:
												"grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2",
											children: [
												(0, a.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, a.jsx)("label", {
															className:
																"block text-xs font-medium text-muted-foreground",
															children: "Address type",
														}),
														(0, a.jsx)(u.Zi, {
															options: D,
															value: Z.address_type,
															onValueChange: (e) =>
																E("address_type", e || "Billing"),
															placeholder: "Type…",
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, a.jsx)("label", {
															className:
																"block text-xs font-medium text-muted-foreground",
															children: "Country",
														}),
														(0, a.jsx)(u.Zi, {
															options: $,
															value: Z.country,
															onValueChange: (e) => E("country", e),
															placeholder: "Search country…",
															isLoading: t,
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "sm:col-span-2 space-y-2",
													children: [
														(0, a.jsx)("label", {
															className:
																"block text-xs font-medium text-muted-foreground",
															children: "Address line 1",
														}),
														(0, a.jsx)(c.p, {
															value: Z.address_line1,
															onChange: (e) =>
																E("address_line1", e.target.value),
															placeholder: "Street, building, unit",
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "sm:col-span-2 space-y-2",
													children: [
														(0, a.jsx)("label", {
															className:
																"block text-xs font-medium text-muted-foreground",
															children: "Address line 2",
														}),
														(0, a.jsx)(c.p, {
															value: Z.address_line2,
															onChange: (e) =>
																E("address_line2", e.target.value),
															placeholder:
																"Area, landmark (optional)",
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, a.jsx)("label", {
															className:
																"block text-xs font-medium text-muted-foreground",
															children: "City",
														}),
														(0, a.jsx)(c.p, {
															value: Z.city,
															onChange: (e) =>
																E("city", e.target.value),
															placeholder: "City",
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, a.jsx)("label", {
															className:
																"block text-xs font-medium text-muted-foreground",
															children: "State / region",
														}),
														(0, a.jsx)(c.p, {
															value: Z.state,
															onChange: (e) =>
																E("state", e.target.value),
															placeholder: "State or region",
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, a.jsx)("label", {
															className:
																"block text-xs font-medium text-muted-foreground",
															children: "Postal code",
														}),
														(0, a.jsx)(c.p, {
															value: Z.pincode,
															onChange: (e) =>
																E("pincode", e.target.value),
															placeholder: "ZIP / PO Box",
														}),
													],
												}),
											],
										}),
									}),
								],
							}),
						}),
						S.length > 0
							? (0, a.jsxs)(d.Zp, {
									className: "border-amber-500/40 shadow-sm",
									children: [
										(0, a.jsx)(d.aR, {
											className: "pb-2",
											children: (0, a.jsx)(d.ZB, {
												className: "text-base",
												children: "Possible duplicates",
											}),
										}),
										(0, a.jsxs)(d.Wu, {
											className: "space-y-3",
											children: [
												(0, a.jsx)("ul", {
													className: "space-y-2 text-sm",
													children: S.map((s) =>
														(0, a.jsxs)(
															"li",
															{
																className:
																	"flex items-center justify-between gap-3",
																children: [
																	(0, a.jsxs)("div", {
																		children: [
																			(0, a.jsx)("p", {
																				className:
																					"font-medium",
																				children: String(
																					s.customer_name ||
																						s.name
																				),
																			}),
																			(0, a.jsx)("p", {
																				className:
																					"text-xs text-muted-foreground",
																				children: [
																					s.mobile_no,
																					s.email_id,
																					s.name,
																				]
																					.filter(
																						Boolean
																					)
																					.join(
																						" \xb7 "
																					),
																			}),
																		],
																	}),
																	(0, a.jsx)(o.$, {
																		type: "button",
																		variant: "outline",
																		size: "sm",
																		onClick: () =>
																			e(
																				"crm-customer-detail",
																				{
																					id: String(
																						s.name
																					),
																				}
																			),
																		children: "Open",
																	}),
																],
															},
															String(s.name)
														)
													),
												}),
												(0, a.jsxs)(o.$, {
													type: "button",
													variant: "secondary",
													disabled: f,
													onClick: () => P(!0),
													children: [
														f
															? (0, a.jsx)(y.A, {
																	className:
																		"mr-2 h-4 w-4 animate-spin",
															  })
															: null,
														"Create anyway",
													],
												}),
											],
										}),
									],
							  })
							: null,
						(0, a.jsxs)(m.h, {
							children: [
								(0, a.jsx)(o.$, {
									variant: "outline",
									onClick: () => e("crm-customers"),
									disabled: f,
									children: "Cancel",
								}),
								(0, a.jsxs)(o.$, {
									onClick: () => P(!1),
									disabled: f,
									children: [
										f
											? (0, a.jsx)(y.A, {
													className: "mr-2 h-4 w-4 animate-spin",
											  })
											: null,
										"Create customer",
									],
								}),
							],
						}),
					],
				});
			}
		},
		56728: (e, s, t) => {
			t.d(s, { r: () => h });
			var a = t(95155),
				r = t(12115),
				l = t(90901),
				i = t(44855),
				n = t(32144),
				o = t(10086),
				d = t(4474),
				c = t(39658),
				m = t(79792),
				u = t(74350),
				p = t(6296),
				x = t(66609);
			function h({
				value: e,
				onValueChange: s,
				valueLabel: t,
				placeholder: g = "Search territory…",
				disabled: y,
				className: b,
				allowCreate: f = !0,
			}) {
				let { mutate: j } = (0, l.iX)(),
					[v, N] = (0, r.useState)(""),
					[_, C] = (0, r.useState)(t || ""),
					[k, w] = (0, r.useState)(!1),
					[S, A] = (0, r.useState)(!1),
					[R, B] = (0, r.useState)(""),
					[Z, M] = (0, r.useState)(""),
					{ data: L, isLoading: T } = (0, i.Ay)(["crm-link-territories", v], () =>
						(0, n.VU)(v || void 0)
					),
					{ data: $ } = (0, i.Ay)(k ? ["crm-link-territory-groups"] : null, () =>
						(0, n.VU)(void 0, 1)
					),
					D = (0, r.useMemo)(
						() =>
							(L || []).map((e) => ({
								value: String(e.name),
								label: String(e.label || e.name),
								description: e.parent_territory
									? String(e.parent_territory)
									: void 0,
							})),
						[L]
					),
					I = (0, r.useMemo)(
						() =>
							($ || []).map((e) => ({
								value: String(e.name),
								label: String(e.label || e.name),
							})),
						[$]
					),
					E = (e && (_ || t)) || D.find((s) => s.value === e)?.label || void 0,
					O = async () => {
						let e = R.trim();
						if (!e) return void x.o.error("Territory name is required");
						A(!0);
						try {
							let t = await (0, n.W$)(e, Z || void 0);
							await j(
								(e) =>
									Array.isArray(e) &&
									String(e[0]).startsWith("crm-link-territor"),
								void 0,
								{ revalidate: !0 }
							),
								C(t.label || t.name),
								s(t.name),
								w(!1),
								B(""),
								x.o.success(`Created: ${t.label || t.name}`);
						} catch (e) {
							x.o.error(
								e instanceof Error ? e.message : "Could not create territory"
							);
						} finally {
							A(!1);
						}
					};
				return (0, a.jsxs)(a.Fragment, {
					children: [
						(0, a.jsx)(o.Zi, {
							className: b,
							options: D,
							value: e,
							valueLabel: E,
							portaled: !0,
							onValueChange: (e) => {
								let t = D.find((s) => s.value === e);
								C(t?.label || e || ""), s(e || "");
							},
							onSearchChange: N,
							placeholder: g,
							emptyMessage: "No territories found",
							isLoading: T,
							disabled: y,
							onCreateNew: f && !y ? () => w(!0) : void 0,
							createNewLabel: "Create territory",
						}),
						(0, a.jsx)(u.lG, {
							open: k,
							onOpenChange: w,
							children: (0, a.jsxs)(u.Cf, {
								className: "sm:max-w-md",
								children: [
									(0, a.jsxs)(u.c7, {
										children: [
											(0, a.jsx)(u.L3, { children: "New territory" }),
											(0, a.jsx)(u.rr, {
												children:
													"Creates a Territory master and selects it on this form.",
											}),
										],
									}),
									(0, a.jsxs)("div", {
										className: "grid gap-3 py-2",
										children: [
											(0, a.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, a.jsx)(m.J, {
														children: "Territory name *",
													}),
													(0, a.jsx)(c.p, {
														value: R,
														onChange: (e) => B(e.target.value),
														placeholder: "e.g. Manama",
													}),
												],
											}),
											I.length
												? (0, a.jsxs)("div", {
														className: "space-y-1",
														children: [
															(0, a.jsx)(m.J, {
																children: "Parent territory",
															}),
															(0, a.jsx)(o.Zi, {
																options: I,
																value: Z,
																onValueChange: M,
																placeholder: "Optional parent…",
																portaled: !0,
															}),
														],
												  })
												: null,
										],
									}),
									(0, a.jsxs)(u.Es, {
										children: [
											(0, a.jsx)(d.$, {
												type: "button",
												variant: "outline",
												onClick: () => w(!1),
												children: "Cancel",
											}),
											(0, a.jsx)(d.$, {
												type: "button",
												onClick: () => void O(),
												disabled: S,
												children: S
													? (0, a.jsx)(p.A, {
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
		66088: (e, s, t) => {
			t.d(s, { A: () => a });
			let a = (0, t(90425).A)("chevron-down", [
				["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }],
			]);
		},
		93108: (e, s, t) => {
			t.d(s, { B: () => c, y: () => m });
			var a = t(95155),
				r = t(12115),
				l = t(66609),
				i = t(13545),
				n = t(12651),
				o = t(33210),
				d = t(91337);
			function c() {
				let [e, s] = (0, r.useState)(""),
					[t, a] = (0, r.useState)(""),
					i = (0, r.useCallback)((e, t = "Something went wrong.") => {
						let r =
							(e instanceof Error ? e.message : "string" == typeof e ? e : "")
								.replace(/<br\s*\/?>/gi, "\n")
								.replace(/<[^>]*>/g, "")
								.trim() || t;
						return (
							a(""),
							s(r),
							l.o.error(r, { duration: 8e3 }),
							"u" > typeof document &&
								document
									.querySelector("main")
									?.scrollTo({ top: 0, behavior: "smooth" }),
							r
						);
					}, []);
				return {
					error: e,
					success: t,
					showError: i,
					showSuccess: (0, r.useCallback)((e) => {
						s(""), a(e), l.o.success(e);
					}, []),
					clear: (0, r.useCallback)(() => {
						s(""), a("");
					}, []),
				};
			}
			function m({ error: e, success: s, onDismiss: t, className: r }) {
				if (!e && !s) return null;
				let l = !!e;
				return (0, a.jsx)("div", {
					className: (0, d.cn)("sticky top-0 z-40 -mx-1 px-1 pt-1", r),
					children: (0, a.jsxs)("div", {
						role: l ? "alert" : "status",
						"aria-live": l ? "assertive" : "polite",
						className: (0, d.cn)(
							"flex items-start gap-2 rounded-xl border p-3 text-sm shadow-sm backdrop-blur",
							l
								? "border-destructive/40 bg-destructive/10 text-destructive"
								: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
						),
						children: [
							l
								? (0, a.jsx)(i.A, { className: "mt-0.5 h-4 w-4 shrink-0" })
								: (0, a.jsx)(n.A, { className: "mt-0.5 h-4 w-4 shrink-0" }),
							(0, a.jsx)("p", {
								className: "flex-1 whitespace-pre-wrap break-words",
								children: e || s,
							}),
							t
								? (0, a.jsx)("button", {
										type: "button",
										onClick: t,
										"aria-label": "Dismiss message",
										className:
											"rounded p-0.5 opacity-70 transition-opacity hover:opacity-100",
										children: (0, a.jsx)(o.A, { className: "h-4 w-4" }),
								  })
								: null,
						],
					}),
				});
			}
		},
	},
]);
