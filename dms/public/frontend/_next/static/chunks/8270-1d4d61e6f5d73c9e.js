"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[8270],
	{
		7915: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("eye", [
				[
					"path",
					{
						d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
						key: "1nclc0",
					},
				],
				["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }],
			]);
		},
		23511: (e, t, s) => {
			s.d(t, { E: () => n });
			var a = s(95155),
				r = s(91337);
			function n({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, r.cn)("bg-accent animate-pulse rounded-md", e),
					...t,
				});
			}
		},
		43447: (e, t, s) => {
			s.d(t, {
				SQ: () => o,
				_2: () => d,
				lp: () => c,
				mB: () => m,
				rI: () => i,
				ty: () => l,
			});
			var a = s(95155);
			s(12115);
			var r = s(61108),
				n = s(91337);
			function i({ ...e }) {
				return (0, a.jsx)(r.bL, { "data-slot": "dropdown-menu", ...e });
			}
			function l({ ...e }) {
				return (0, a.jsx)(r.l9, { "data-slot": "dropdown-menu-trigger", ...e });
			}
			function o({ className: e, sideOffset: t = 4, ...s }) {
				return (0, a.jsx)(r.ZL, {
					children: (0, a.jsx)(r.UC, {
						"data-slot": "dropdown-menu-content",
						sideOffset: t,
						className: (0, n.cn)(
							"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
							e
						),
						...s,
					}),
				});
			}
			function d({ className: e, inset: t, variant: s = "default", ...i }) {
				return (0, a.jsx)(r.q7, {
					"data-slot": "dropdown-menu-item",
					"data-inset": t,
					"data-variant": s,
					className: (0, n.cn)(
						"focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...i,
				});
			}
			function c({ className: e, inset: t, ...s }) {
				return (0, a.jsx)(r.JU, {
					"data-slot": "dropdown-menu-label",
					"data-inset": t,
					className: (0, n.cn)("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", e),
					...s,
				});
			}
			function m({ className: e, ...t }) {
				return (0, a.jsx)(r.wv, {
					"data-slot": "dropdown-menu-separator",
					className: (0, n.cn)("bg-border -mx-1 my-1 h-px", e),
					...t,
				});
			}
		},
		49387: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("pencil", [
				[
					"path",
					{
						d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
						key: "1a8usu",
					},
				],
				["path", { d: "m15 5 4 4", key: "1mk7zo" }],
			]);
		},
		49580: (e, t, s) => {
			s.d(t, { e: () => d });
			var a = s(95155),
				r = s(12115),
				n = s(81262),
				i = s(5240),
				l = s(4474),
				o = s(43447);
			function d({
				doctype: e,
				docName: t,
				noLetterhead: s = 0,
				triggerPrint: c = 0,
				className: m,
				variant: u = "default",
			}) {
				let [p, x] = (0, r.useState)(null),
					[h, j] = (0, r.useState)(!1),
					[g, y] = (0, r.useState)(!1);
				(0, r.useEffect)(() => {
					if (!e) return void x(["Standard"]);
					let t = !1;
					return (
						(0, i.Iy)(e)
							.then((e) => {
								t || x(e.length ? e : ["Standard"]);
							})
							.catch(() => {
								t || x(["Standard"]);
							}),
						() => {
							t = !0;
						}
					);
				}, [e]);
				let v = (a) => {
						e &&
							t &&
							(function (e, t, s = "Standard", a) {
								let r = new URLSearchParams();
								r.set("doctype", e),
									r.set("name", t),
									r.set("format", s),
									r.set("trigger_print", String(a?.triggerPrint ?? 0)),
									r.set("no_letterhead", String(a?.noLetterhead ?? 0));
								let n = window.location.origin;
								window.open(
									`${n}/printview?${r.toString()}`,
									"_blank",
									"noopener,noreferrer"
								);
							})(e, t, a, { noLetterhead: s, triggerPrint: c });
					},
					f = async (s) => {
						if ((s.stopPropagation(), s.preventDefault(), !g && e && t)) {
							y(!0);
							try {
								let t = p;
								if (!t) {
									let s = await (0, i.Iy)(e);
									(t = s.length ? s : ["Standard"]), x(t);
								}
								if (t.length <= 1) return void v(t[0] || "Standard");
								j(!0);
							} catch {
								v("Standard");
							} finally {
								y(!1);
							}
						}
					},
					_ = "icon" === u,
					b = {
						type: "button",
						variant: _ ? "ghost" : "outline",
						size: _ ? "icon" : "sm",
						className: m,
						"aria-label": "Print",
						title: "Print",
						disabled: g,
					};
				return p && p.length > 1
					? (0, a.jsxs)(o.rI, {
							open: h,
							onOpenChange: j,
							children: [
								(0, a.jsx)(o.ty, {
									asChild: !0,
									children: (0, a.jsxs)(l.$, {
										...b,
										onClick: (e) => e.stopPropagation(),
										children: [
											(0, a.jsx)(n.A, {
												className: _ ? "h-4 w-4" : "h-4 w-4 mr-2",
											}),
											!_ && "Print",
										],
									}),
								}),
								(0, a.jsxs)(o.SQ, {
									align: "end",
									side: "bottom",
									sideOffset: 4,
									collisionPadding: 8,
									className: "min-w-[180px] z-[9999]",
									onClick: (e) => e.stopPropagation(),
									children: [
										(0, a.jsx)(o.lp, {
											className: "text-xs font-medium text-muted-foreground",
											children: "Print format",
										}),
										(0, a.jsx)(o.mB, {}),
										p.map((e) =>
											(0, a.jsx)(
												o._2,
												{
													onSelect: () => {
														v(e), j(!1);
													},
													children: e,
												},
												e
											)
										),
									],
								}),
							],
					  })
					: (0, a.jsxs)(l.$, {
							...b,
							onClick: f,
							children: [
								(0, a.jsx)(n.A, { className: _ ? "h-4 w-4" : "h-4 w-4 mr-2" }),
								!_ && "Print",
							],
					  });
			}
		},
		58270: (e, t, s) => {
			s.r(t), s.d(t, { default: () => w });
			var a = s(95155),
				r = s(12115),
				n = s(44855),
				i = s(32144),
				l = s(55833),
				o = s(63360),
				d = s(4474),
				c = s(79984),
				m = s(39658),
				u = s(23511),
				p = s(93408),
				x = s(92461),
				h = s(43447),
				j = s(51914),
				g = s(61878),
				y = s(60285),
				v = s(7915),
				f = s(49387),
				_ = s(85118),
				b = s(92289);
			function w() {
				let { navigate: e } = (0, l.c)(),
					{ canWrite: t } = (0, o.Sk)(),
					[s, w] = (0, r.useState)(""),
					[N, C] = (0, r.useState)(!1),
					[k, S] = (0, r.useState)(null),
					{
						data: A,
						isLoading: z,
						mutate: E,
					} = (0, n.Ay)(["crm-customers", s], () =>
						(0, i.Ui)({ search: s || void 0, limit: 50 })
					),
					M = A?.data || [],
					P = A?.message || (0 === M.length ? "No DMS customers found." : null);
				return (0, a.jsxs)("div", {
					className: "space-y-4",
					children: [
						(0, a.jsx)("div", {
							className: "flex justify-end",
							children: (0, a.jsxs)(d.$, {
								onClick: () => e("crm-customer-new"),
								children: [
									(0, a.jsx)(j.A, { className: "mr-2 h-4 w-4" }),
									"New Customer",
								],
							}),
						}),
						(0, a.jsxs)(c.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, a.jsx)(c.aR, {
									className: "pb-3",
									children: (0, a.jsxs)("div", {
										className: "relative",
										children: [
											(0, a.jsx)(g.A, {
												className:
													"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
											}),
											(0, a.jsx)(m.p, {
												className: "pl-9",
												placeholder: "Search customers…",
												value: s,
												onChange: (e) => w(e.target.value),
											}),
										],
									}),
								}),
								(0, a.jsx)(c.Wu, {
									children: z
										? (0, a.jsx)(u.E, { className: "h-24" })
										: (0, a.jsx)("div", {
												className: "dms-table-panel",
												children: (0, a.jsxs)("table", {
													className: "w-full table-fixed text-sm",
													style: { minWidth: "60rem" },
													children: [
														(0, a.jsx)("thead", {
															children: (0, a.jsxs)("tr", {
																className:
																	"border-b text-left text-xs text-muted-foreground",
																children: [
																	(0, a.jsx)("th", {
																		className:
																			"w-[260px] pb-2 font-medium",
																		children: "Customer",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"w-[130px] pb-2 font-medium",
																		children: "Mobile",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"w-[180px] pb-2 font-medium",
																		children: "Email",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"w-[150px] pb-2 font-medium",
																		children: "Group",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"w-[100px] pb-2 font-medium",
																		children: "Type",
																	}),
																	(0, a.jsx)("th", {
																		className:
																			"w-[92px] pb-2 text-right font-medium",
																		children: "Actions",
																	}),
																	(0, a.jsx)("th", {
																		className: "w-auto pb-2",
																		"aria-hidden": !0,
																	}),
																],
															}),
														}),
														(0, a.jsx)("tbody", {
															children:
																0 === M.length
																	? (0, a.jsx)("tr", {
																			children: (0, a.jsx)(
																				"td",
																				{
																					colSpan: 7,
																					className:
																						"py-10 text-center text-muted-foreground",
																					children: P,
																				}
																			),
																	  })
																	: M.map((s) => {
																			let r = String(s.name),
																				n = s.mobile_no
																					? String(
																							s.mobile_no
																					  )
																					: "",
																				i = s.email_id
																					? String(
																							s.email_id
																					  )
																					: "";
																			return (0, a.jsxs)(
																				"tr",
																				{
																					className:
																						"cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40",
																					onClick: () =>
																						e(
																							"crm-customer-detail",
																							{
																								id: r,
																							}
																						),
																					children: [
																						(0,
																						a.jsxs)(
																							"td",
																							{
																								className:
																									"py-2.5 pr-2",
																								children:
																									[
																										(0,
																										a.jsx)(
																											"p",
																											{
																												className:
																													"max-w-[220px] truncate font-medium",
																												children:
																													String(
																														s.customer_name ||
																															s.name
																													),
																											}
																										),
																										(0,
																										a.jsx)(
																											"p",
																											{
																												className:
																													"truncate text-xs text-muted-foreground",
																												children:
																													r,
																											}
																										),
																									],
																							}
																						),
																						(0, a.jsx)(
																							"td",
																							{
																								className:
																									"py-2.5 pr-2 text-muted-foreground",
																								children:
																									n ||
																									"—",
																							}
																						),
																						(0, a.jsx)(
																							"td",
																							{
																								className:
																									"py-2.5 pr-2 text-muted-foreground",
																								children:
																									i
																										? (0,
																										  a.jsx)(
																												"span",
																												{
																													className:
																														"block max-w-[170px] truncate",
																													title: i,
																													children:
																														i,
																												}
																										  )
																										: "—",
																							}
																						),
																						(0, a.jsx)(
																							"td",
																							{
																								className:
																									"py-2.5 pr-2 text-muted-foreground",
																								children:
																									(0,
																									a.jsx)(
																										"span",
																										{
																											className:
																												"block max-w-[140px] truncate",
																											title: String(
																												s.customer_group ||
																													""
																											),
																											children:
																												String(
																													s.customer_group ||
																														"—"
																												),
																										}
																									),
																							}
																						),
																						(0, a.jsx)(
																							"td",
																							{
																								className:
																									"py-2.5 pr-2 text-muted-foreground",
																								children:
																									String(
																										s.customer_type ||
																											"—"
																									),
																							}
																						),
																						(0, a.jsx)(
																							"td",
																							{
																								className:
																									"py-2.5 pr-2 text-right",
																								children:
																									(0,
																									a.jsx)(
																										p.m,
																										{
																											doctype:
																												"Customer",
																											docName:
																												r,
																											children:
																												(0,
																												a.jsxs)(
																													h.rI,
																													{
																														children:
																															[
																																(0,
																																a.jsx)(
																																	h.ty,
																																	{
																																		asChild:
																																			!0,
																																		children:
																																			(0,
																																			a.jsxs)(
																																				d.$,
																																				{
																																					variant:
																																						"ghost",
																																					size: "icon",
																																					className:
																																						"h-8 w-8 shrink-0",
																																					children:
																																						[
																																							(0,
																																							a.jsx)(
																																								y.A,
																																								{
																																									className:
																																										"h-4 w-4",
																																								}
																																							),
																																							(0,
																																							a.jsx)(
																																								"span",
																																								{
																																									className:
																																										"sr-only",
																																									children:
																																										"Actions",
																																								}
																																							),
																																						],
																																				}
																																			),
																																	}
																																),
																																(0,
																																a.jsxs)(
																																	h.SQ,
																																	{
																																		align: "end",
																																		children:
																																			[
																																				(0,
																																				a.jsxs)(
																																					h._2,
																																					{
																																						onClick:
																																							() =>
																																								e(
																																									"crm-customer-detail",
																																									{
																																										id: r,
																																									}
																																								),
																																						children:
																																							[
																																								(0,
																																								a.jsx)(
																																									v.A,
																																									{
																																										className:
																																											"mr-2 h-4 w-4",
																																									}
																																								),
																																								"View Details",
																																							],
																																					}
																																				),
																																				t(
																																					"customers"
																																				)
																																					? (0,
																																					  a.jsxs)(
																																							h._2,
																																							{
																																								onClick:
																																									() => {
																																										let e;
																																										S(
																																											{
																																												name: (e =
																																													(
																																														e
																																													) =>
																																														null ==
																																														e
																																															? ""
																																															: String(
																																																	e
																																															  ))(
																																													s.name
																																												),
																																												customer_name:
																																													e(
																																														s.customer_name
																																													),
																																												customer_type:
																																													e(
																																														s.customer_type
																																													),
																																												customer_group:
																																													e(
																																														s.customer_group
																																													),
																																												mobile_no:
																																													e(
																																														s.mobile_no
																																													),
																																												email_id:
																																													e(
																																														s.email_id
																																													),
																																												territory:
																																													e(
																																														s.territory
																																													),
																																												tax_id: e(
																																													s.tax_id
																																												),
																																												website:
																																													e(
																																														s.website
																																													),
																																											}
																																										),
																																											C(
																																												!0
																																											);
																																									},
																																								children:
																																									[
																																										(0,
																																										a.jsx)(
																																											f.A,
																																											{
																																												className:
																																													"mr-2 h-4 w-4",
																																											}
																																										),
																																										"Edit Customer",
																																									],
																																							}
																																					  )
																																					: null,
																																				n
																																					? (0,
																																					  a.jsxs)(
																																							h._2,
																																							{
																																								onClick:
																																									() =>
																																										window.open(
																																											`tel:${n}`,
																																											"_self"
																																										),
																																								children:
																																									[
																																										(0,
																																										a.jsx)(
																																											_.A,
																																											{
																																												className:
																																													"mr-2 h-4 w-4",
																																											}
																																										),
																																										"Call",
																																									],
																																							}
																																					  )
																																					: null,
																																				i
																																					? (0,
																																					  a.jsxs)(
																																							h._2,
																																							{
																																								onClick:
																																									() =>
																																										window.open(
																																											`mailto:${i}`,
																																											"_self"
																																										),
																																								children:
																																									[
																																										(0,
																																										a.jsx)(
																																											b.A,
																																											{
																																												className:
																																													"mr-2 h-4 w-4",
																																											}
																																										),
																																										"Email",
																																									],
																																							}
																																					  )
																																					: null,
																																			],
																																	}
																																),
																															],
																													}
																												),
																										}
																									),
																							}
																						),
																						(0, a.jsx)(
																							"td",
																							{
																								"aria-hidden":
																									!0,
																							}
																						),
																					],
																				},
																				r
																			);
																	  }),
														}),
													],
												}),
										  }),
								}),
							],
						}),
						(0, a.jsx)(x.h, {
							open: N,
							onOpenChange: (e) => {
								C(e), e || S(null);
							},
							customer: k,
							onUpdated: () => {
								E();
							},
						}),
					],
				});
			}
		},
		60285: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("ellipsis", [
				["circle", { cx: "12", cy: "12", r: "1", key: "41hilf" }],
				["circle", { cx: "19", cy: "12", r: "1", key: "1wjl8i" }],
				["circle", { cx: "5", cy: "12", r: "1", key: "1pcz8c" }],
			]);
		},
		61878: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
		81262: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("printer", [
				[
					"path",
					{
						d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",
						key: "143wyd",
					},
				],
				["path", { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6", key: "1itne7" }],
				["rect", { x: "6", y: "14", width: "12", height: "8", rx: "1", key: "1ue0tg" }],
			]);
		},
		85118: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("phone", [
				[
					"path",
					{
						d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
						key: "9njp5v",
					},
				],
			]);
		},
		92289: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("mail", [
				["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7", key: "132q7q" }],
				["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2", key: "izxlao" }],
			]);
		},
		92461: (e, t, s) => {
			s.d(t, { h: () => h });
			var a = s(95155),
				r = s(12115),
				n = s(6296),
				i = s(66609),
				l = s(90901),
				o = s(44855),
				d = s(74350),
				c = s(4474),
				m = s(39658),
				u = s(79792),
				p = s(10086),
				x = s(32144);
			function h({ open: e, onOpenChange: t, customer: s, onUpdated: j }) {
				let { mutate: g } = (0, l.iX)(),
					{ data: y } = (0, o.Ay)(e ? "crm-customer-create-options" : null, x.$I),
					[v, f] = (0, r.useState)(!1),
					[_, b] = (0, r.useState)({
						customer_name: "",
						customer_type: "Individual",
						customer_group: "",
						mobile_no: "",
						email_id: "",
						territory: "",
						tax_id: "",
						website: "",
					}),
					w = (0, r.useRef)(null);
				(0, r.useEffect)(() => {
					if (!e || !s) {
						w.current = null;
						return;
					}
					w.current !== s.name &&
						((w.current = s.name),
						b({
							customer_name: s.customer_name || "",
							customer_type: s.customer_type || "Individual",
							customer_group: s.customer_group || "",
							mobile_no: s.mobile_no || "",
							email_id: s.email_id || "",
							territory: s.territory || "",
							tax_id: s.tax_id || "",
							website: s.website || "",
						}));
				}, [e, s]);
				let N = (0, r.useMemo)(
						() =>
							(y?.customer_types || ["Individual", "Company"]).map((e) => ({
								value: e,
								label: e,
							})),
						[y]
					),
					C = (0, r.useMemo)(
						() => (y?.customer_groups || []).map((e) => ({ value: e, label: e })),
						[y]
					),
					k = (0, r.useMemo)(
						() => (y?.territories || []).map((e) => ({ value: e, label: e })),
						[y]
					);
				async function S(e) {
					if ((e.preventDefault(), s?.name)) {
						if (!_.customer_name.trim())
							return void i.o.error("Customer name is required");
						f(!0);
						try {
							await (0, x.Gk)(s.name, {
								customer_name: _.customer_name.trim(),
								customer_type: _.customer_type,
								customer_group: _.customer_group || null,
								mobile_no: _.mobile_no.trim() || null,
								email_id: _.email_id.trim() || null,
								territory: _.territory || null,
								tax_id: _.tax_id.trim() || null,
								website: _.website.trim() || null,
							}),
								await g(
									(e) =>
										(Array.isArray(e) &&
											("customers" === e[0] ||
												"customers-paginated" === e[0] ||
												"crm-customers" === e[0] ||
												"crm-customer-360" === e[0] ||
												"customer-360" === e[0])) ||
										"customers" === e,
									void 0,
									{ revalidate: !0 }
								),
								i.o.success("Customer updated"),
								j?.(s.name),
								t(!1);
						} catch (e) {
							i.o.error(
								e instanceof Error ? e.message : "Failed to update customer"
							);
						} finally {
							f(!1);
						}
					}
				}
				return (0, a.jsx)(d.lG, {
					open: e,
					onOpenChange: t,
					children: (0, a.jsx)(d.Cf, {
						className: "sm:max-w-lg",
						children: (0, a.jsxs)("form", {
							onSubmit: S,
							children: [
								(0, a.jsxs)(d.c7, {
									children: [
										(0, a.jsx)(d.L3, { children: "Edit customer" }),
										(0, a.jsx)(d.rr, {
											children:
												"Update customer master details used across DMS and CRM.",
										}),
									],
								}),
								(0, a.jsxs)("div", {
									className: "grid gap-3 py-4",
									children: [
										(0, a.jsxs)("div", {
											className: "space-y-1",
											children: [
												(0, a.jsx)(u.J, { children: "Customer name *" }),
												(0, a.jsx)(m.p, {
													value: _.customer_name,
													onChange: (e) =>
														b((t) => ({
															...t,
															customer_name: e.target.value,
														})),
													autoFocus: !0,
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "grid grid-cols-2 gap-2",
											children: [
												(0, a.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, a.jsx)(u.J, { children: "Type" }),
														(0, a.jsx)(p.Zi, {
															options: N,
															value: _.customer_type,
															onValueChange: (e) =>
																b((t) => ({
																	...t,
																	customer_type: e,
																})),
															placeholder: "Type",
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, a.jsx)(u.J, {
															children: "Customer group",
														}),
														(0, a.jsx)(p.Zi, {
															options: C,
															value: _.customer_group,
															onValueChange: (e) =>
																b((t) => ({
																	...t,
																	customer_group: e,
																})),
															placeholder: "Group",
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
														(0, a.jsx)(u.J, { children: "Mobile" }),
														(0, a.jsx)(m.p, {
															type: "tel",
															value: _.mobile_no,
															onChange: (e) =>
																b((t) => ({
																	...t,
																	mobile_no: e.target.value,
																})),
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, a.jsx)(u.J, { children: "Email" }),
														(0, a.jsx)(m.p, {
															type: "email",
															value: _.email_id,
															onChange: (e) =>
																b((t) => ({
																	...t,
																	email_id: e.target.value,
																})),
														}),
													],
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-1",
											children: [
												(0, a.jsx)(u.J, { children: "Territory" }),
												(0, a.jsx)(p.Zi, {
													options: k,
													value: _.territory,
													onValueChange: (e) =>
														b((t) => ({ ...t, territory: e })),
													placeholder: "Territory",
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "grid grid-cols-2 gap-2",
											children: [
												(0, a.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, a.jsx)(u.J, { children: "Tax ID" }),
														(0, a.jsx)(m.p, {
															value: _.tax_id,
															onChange: (e) =>
																b((t) => ({
																	...t,
																	tax_id: e.target.value,
																})),
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, a.jsx)(u.J, { children: "Website" }),
														(0, a.jsx)(m.p, {
															value: _.website,
															onChange: (e) =>
																b((t) => ({
																	...t,
																	website: e.target.value,
																})),
														}),
													],
												}),
											],
										}),
									],
								}),
								(0, a.jsxs)(d.Es, {
									children: [
										(0, a.jsx)(c.$, {
											type: "button",
											variant: "outline",
											onClick: () => t(!1),
											children: "Cancel",
										}),
										(0, a.jsxs)(c.$, {
											type: "submit",
											disabled: v,
											children: [
												v
													? (0, a.jsx)(n.A, {
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
		},
		93408: (e, t, s) => {
			s.d(t, { m: () => n });
			var a = s(95155),
				r = s(49580);
			function n({ children: e, doctype: t, docName: s, showPrint: i = !0 }) {
				return (0, a.jsxs)("div", {
					className: "flex items-center justify-end gap-0.5",
					onClick: (e) => e.stopPropagation(),
					children: [
						e,
						i ? (0, a.jsx)(r.e, { variant: "icon", doctype: t, docName: s }) : null,
					],
				});
			}
		},
	},
]);
