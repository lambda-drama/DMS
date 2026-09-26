"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[1910],
	{
		284: (e, t, a) => {
			let s;
			a.d(t, {
				rc: () => R,
				ZD: () => M,
				UC: () => z,
				VY: () => Z,
				hJ: () => L,
				ZL: () => E,
				bL: () => $,
				hE: () => O,
			});
			var r = a(12115),
				n = a(68599),
				i = a(47527),
				l = a(29483),
				o = a(70379),
				d = a(95155),
				c = Symbol("radix.slottable"),
				u = "AlertDialog",
				[m, x] = (0, n.A)(u, [l.Hs]),
				p = (0, l.Hs)(),
				h = (e) => {
					let { __scopeAlertDialog: t, ...a } = e,
						s = p(t);
					return (0, d.jsx)(l.bL, { ...s, ...a, modal: !0 });
				};
			(h.displayName = u),
				(r.forwardRef((e, t) => {
					let { __scopeAlertDialog: a, ...s } = e,
						r = p(a);
					return (0, d.jsx)(l.l9, { ...r, ...s, ref: t });
				}).displayName = "AlertDialogTrigger");
			var g = (e) => {
				let { __scopeAlertDialog: t, ...a } = e,
					s = p(t);
				return (0, d.jsx)(l.ZL, { ...s, ...a });
			};
			g.displayName = "AlertDialogPortal";
			var b = r.forwardRef((e, t) => {
				let { __scopeAlertDialog: a, ...s } = e,
					r = p(a);
				return (0, d.jsx)(l.hJ, { ...r, ...s, ref: t });
			});
			b.displayName = "AlertDialogOverlay";
			var f = "AlertDialogContent",
				[j, y] = m(f),
				v =
					(((s = ({ children: e }) =>
						(0, d.jsx)(d.Fragment, { children: e })).displayName =
						"AlertDialogContent.Slottable"),
					(s.__radixId = c),
					s),
				N = r.forwardRef((e, t) => {
					let { __scopeAlertDialog: a, children: s, ...n } = e,
						c = p(a),
						u = r.useRef(null),
						m = (0, i.s)(t, u),
						x = r.useRef(null);
					return (0, d.jsx)(l.G$, {
						contentName: f,
						titleName: w,
						docsSlug: "alert-dialog",
						children: (0, d.jsx)(j, {
							scope: a,
							cancelRef: x,
							children: (0, d.jsxs)(l.UC, {
								role: "alertdialog",
								...c,
								...n,
								ref: m,
								onOpenAutoFocus: (0, o.mK)(n.onOpenAutoFocus, (e) => {
									e.preventDefault(), x.current?.focus({ preventScroll: !0 });
								}),
								onPointerDownOutside: (e) => e.preventDefault(),
								onInteractOutside: (e) => e.preventDefault(),
								children: [
									(0, d.jsx)(v, { children: s }),
									(0, d.jsx)(q, { contentRef: u }),
								],
							}),
						}),
					});
				});
			N.displayName = f;
			var w = "AlertDialogTitle",
				k = r.forwardRef((e, t) => {
					let { __scopeAlertDialog: a, ...s } = e,
						r = p(a);
					return (0, d.jsx)(l.hE, { ...r, ...s, ref: t });
				});
			k.displayName = w;
			var C = "AlertDialogDescription",
				A = r.forwardRef((e, t) => {
					let { __scopeAlertDialog: a, ...s } = e,
						r = p(a);
					return (0, d.jsx)(l.VY, { ...r, ...s, ref: t });
				});
			A.displayName = C;
			var S = r.forwardRef((e, t) => {
				let { __scopeAlertDialog: a, ...s } = e,
					r = p(a);
				return (0, d.jsx)(l.bm, { ...r, ...s, ref: t });
			});
			S.displayName = "AlertDialogAction";
			var _ = "AlertDialogCancel",
				D = r.forwardRef((e, t) => {
					let { __scopeAlertDialog: a, ...s } = e,
						{ cancelRef: r } = y(_, a),
						n = p(a),
						o = (0, i.s)(t, r);
					return (0, d.jsx)(l.bm, { ...n, ...s, ref: o });
				});
			D.displayName = _;
			var q = ({ contentRef: e }) => {
					let t = `\`${f}\` requires a description for the component to be accessible for screen reader users.

You can add a description to the \`${f}\` by passing a \`${C}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a description by assigning it an \`id\` and passing the same value to the \`aria-describedby\` prop in \`${f}\`. If the description is confusing or duplicative for sighted users, you can use the \`@radix-ui/react-visually-hidden\` primitive as a wrapper around your description component.

For more information, see https://radix-ui.com/primitives/docs/components/alert-dialog`;
					return (
						r.useEffect(() => {
							document.getElementById(e.current?.getAttribute("aria-describedby")) ||
								console.warn(t);
						}, [t, e]),
						null
					);
				},
				$ = h,
				E = g,
				L = b,
				z = N,
				R = S,
				M = D,
				O = k,
				Z = A;
		},
		9089: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("message-square-text", [
				[
					"path",
					{
						d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
						key: "18887p",
					},
				],
				["path", { d: "M7 11h10", key: "1twpyw" }],
				["path", { d: "M7 15h6", key: "d9of3u" }],
				["path", { d: "M7 7h8", key: "af5zfr" }],
			]);
		},
		12651: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		23511: (e, t, a) => {
			a.d(t, { E: () => n });
			var s = a(95155),
				r = a(91337);
			function n({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, r.cn)("bg-accent animate-pulse rounded-md", e),
					...t,
				});
			}
		},
		26730: (e, t, a) => {
			a.d(t, { j: () => o });
			var s = a(95155),
				r = a(6296),
				n = a(70521),
				i = a(4474),
				l = a(91337);
			function o({
				open: e,
				onOpenChange: t,
				title: a,
				description: d,
				confirmLabel: c,
				cancelLabel: u = "Go back",
				loading: m = !1,
				destructive: x = !1,
				onConfirm: p,
			}) {
				return (0, s.jsx)(n.Lt, {
					open: e,
					onOpenChange: (e) => !m && t(e),
					children: (0, s.jsxs)(n.EO, {
						className: "sm:max-w-md",
						children: [
							(0, s.jsxs)(n.wd, {
								children: [
									(0, s.jsx)(n.r7, { children: a }),
									(0, s.jsx)(n.$v, {
										className: "text-sm leading-relaxed",
										children: d,
									}),
								],
							}),
							(0, s.jsxs)(n.ck, {
								children: [
									(0, s.jsx)(n.Zr, { disabled: m, children: u }),
									(0, s.jsxs)(n.Rx, {
										disabled: m,
										className: (0, l.cn)(
											x && (0, i.r)({ variant: "destructive" })
										),
										onClick: (e) => {
											e.preventDefault(), p();
										},
										children: [
											m
												? (0, s.jsx)(r.A, {
														className: "h-4 w-4 animate-spin",
												  })
												: null,
											c,
										],
									}),
								],
							}),
						],
					}),
				});
			}
		},
		38291: (e, t, a) => {
			a.d(t, { E: () => o });
			var s = a(95155);
			a(12115);
			var r = a(42442),
				n = a(18460),
				i = a(91337);
			let l = (0, n.F)(
				"inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
				{
					variants: {
						variant: {
							default:
								"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
							secondary:
								"border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
							destructive:
								"border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
							outline:
								"text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
						},
					},
					defaultVariants: { variant: "default" },
				}
			);
			function o({ className: e, variant: t, asChild: a = !1, ...n }) {
				let d = a ? r.DX : "span";
				return (0, s.jsx)(d, {
					"data-slot": "badge",
					className: (0, i.cn)(l({ variant: t }), e),
					...n,
				});
			}
		},
		51910: (e, t, a) => {
			a.r(t), a.d(t, { default: () => j });
			var s = a(95155),
				r = a(12115),
				n = a(44855),
				i = a(32144),
				l = a(55833),
				o = a(4474),
				d = a(79984),
				c = a(39658),
				u = a(23511),
				m = a(38291),
				x = a(93108),
				p = a(98790),
				h = a(26730),
				g = a(80723),
				b = a(56204),
				f = a(6296);
			function j() {
				let { navigate: e, viewParams: t } = (0, l.c)(),
					a = t.get("id") || "",
					{
						data: j,
						isLoading: v,
						mutate: N,
					} = (0, n.Ay)(a ? ["crm-quotation", a] : null, () => (0, i.Jp)(a)),
					[w, k] = (0, r.useState)([]),
					[C, A] = (0, r.useState)(""),
					[S, _] = (0, r.useState)(!1),
					[D, q] = (0, r.useState)(!1),
					[$, E] = (0, r.useState)(!1),
					{ error: L, success: z, showError: R, showSuccess: M, clear: O } = (0, x.B)();
				if (
					((0, r.useEffect)(() => {
						j &&
							(k(
								(j.items || []).map((e) => ({
									...e,
									qty: Number(e.qty || 1),
									rate: Number(e.rate || 0),
									discount_percentage: Number(e.discount_percentage || 0),
								}))
							),
							A(String(j.valid_till || "").slice(0, 10)));
					}, [j]),
					!a)
				)
					return (0, s.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Missing quotation id.",
					});
				if (v || !j) return (0, s.jsx)(u.E, { className: "h-80" });
				let Z = 0 === Number(j.docstatus),
					F = String(j.currency || ""),
					I = w.reduce((e, t) => {
						let a = Number(t.qty || 0) * Number(t.rate || 0),
							s = (a * Number(t.discount_percentage || 0)) / 100;
						return e + a - s;
					}, 0),
					B = (e, t) => {
						k((a) => {
							let s = [...a];
							return (s[e] = { ...s[e], ...t }), s;
						});
					},
					J = async () => {
						if (Z) {
							_(!0), O();
							try {
								await (0, i.kM)(a, { items: w, valid_till: C || null }),
									await N(),
									M("Quotation saved.");
							} catch (e) {
								R(e, "Failed to save quotation.");
							} finally {
								_(!1);
							}
						}
					},
					Q = async () => {
						if (Z) {
							_(!0), O();
							try {
								w.length &&
									(await (0, i.kM)(a, { items: w, valid_till: C || null })),
									await (0, i.d6)(a),
									await N(),
									E(!1),
									M("Quotation submitted.");
							} catch (e) {
								R(e, "Failed to submit quotation.");
							} finally {
								_(!1);
							}
						}
					};
				return (0, s.jsxs)("div", {
					className: "space-y-4",
					children: [
						(0, s.jsx)(x.y, { error: L, success: z, onDismiss: O }),
						(0, s.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [
								(0, s.jsxs)(o.$, {
									variant: "outline",
									onClick: () => e("crm-quotations"),
									disabled: S,
									children: [
										(0, s.jsx)(g.A, { className: "mr-2 h-4 w-4" }),
										"Quotations",
									],
								}),
								(0, s.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [
										j.opportunity
											? (0, s.jsx)(o.$, {
													variant: "outline",
													disabled: S,
													onClick: () =>
														e("crm-opportunity-detail", {
															id: String(j.opportunity),
														}),
													children: "Open Deal",
											  })
											: null,
										(0, s.jsxs)(o.$, {
											variant: "outline",
											onClick: () => q(!0),
											disabled: S,
											children: [
												(0, s.jsx)(b.A, { className: "mr-2 h-4 w-4" }),
												"Send to Customer",
											],
										}),
										Z
											? (0, s.jsxs)(s.Fragment, {
													children: [
														(0, s.jsxs)(o.$, {
															variant: "outline",
															onClick: () => void J(),
															disabled: S,
															children: [
																S
																	? (0, s.jsx)(f.A, {
																			className:
																				"mr-2 h-4 w-4 animate-spin",
																	  })
																	: null,
																"Save",
															],
														}),
														(0, s.jsxs)(o.$, {
															onClick: () => E(!0),
															disabled: S || !j.can_submit,
															children: [
																S
																	? (0, s.jsx)(f.A, {
																			className:
																				"mr-2 h-4 w-4 animate-spin",
																	  })
																	: null,
																"Submit Quotation",
															],
														}),
													],
											  })
											: null,
									],
								}),
							],
						}),
						(0, s.jsxs)(d.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, s.jsx)(d.aR, {
									className: "pb-3",
									children: (0, s.jsxs)("div", {
										className:
											"flex flex-wrap items-center justify-between gap-2",
										children: [
											(0, s.jsx)(d.ZB, {
												className: "text-base",
												children: String(j.name),
											}),
											(0, s.jsx)(m.E, {
												variant: "outline",
												children: String(
													j.docstatus_label || j.status || "Draft"
												),
											}),
										],
									}),
								}),
								(0, s.jsxs)(d.Wu, {
									className: "grid gap-3 sm:grid-cols-2 text-sm",
									children: [
										(0, s.jsx)(y, {
											label: "Customer",
											children: String(
												j.customer_display || j.party_name || "—"
											),
										}),
										(0, s.jsx)(y, {
											label: "Company",
											children: String(j.company || "—"),
										}),
										(0, s.jsx)(y, {
											label: "Date",
											children: String(j.transaction_date || "—"),
										}),
										(0, s.jsxs)("div", {
											className: "space-y-1.5",
											children: [
												(0, s.jsx)("label", {
													className:
														"text-xs font-medium text-muted-foreground",
													children: "Valid till",
												}),
												Z
													? (0, s.jsx)(c.p, {
															type: "date",
															value: C,
															onChange: (e) => A(e.target.value),
															disabled: S,
													  })
													: (0, s.jsx)("div", {
															children: String(j.valid_till || "—"),
													  }),
											],
										}),
										(0, s.jsx)(y, {
											label: "Deal",
											children: j.opportunity
												? (0, s.jsx)("button", {
														type: "button",
														className: "text-primary hover:underline",
														onClick: () =>
															e("crm-opportunity-detail", {
																id: String(j.opportunity),
															}),
														children: String(
															j.opportunity_title || j.opportunity
														),
												  })
												: "—",
										}),
										(0, s.jsx)(y, {
											label: "Customer status",
											children: String(j.quotation_customer_status || "—"),
										}),
									],
								}),
							],
						}),
						(0, s.jsxs)(d.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, s.jsx)(d.aR, {
									children: (0, s.jsx)(d.ZB, {
										className: "text-base",
										children: "Items",
									}),
								}),
								(0, s.jsxs)(d.Wu, {
									className: "space-y-3",
									children: [
										0 === w.length
											? (0, s.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "No items on this quotation.",
											  })
											: w.map((e, t) => {
													let a =
														Number(e.qty || 0) *
														Number(e.rate || 0) *
														(1 -
															Number(e.discount_percentage || 0) /
																100);
													return (0, s.jsxs)(
														"div",
														{
															className:
																"grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-[1.4fr_5rem_7rem_5rem_7rem]",
															children: [
																(0, s.jsxs)("div", {
																	children: [
																		(0, s.jsx)("div", {
																			className:
																				"font-medium text-sm",
																			children:
																				e.item_name ||
																				e.item_code,
																		}),
																		(0, s.jsx)("div", {
																			className:
																				"text-xs text-muted-foreground",
																			children: e.item_code,
																		}),
																	],
																}),
																Z
																	? (0, s.jsxs)(s.Fragment, {
																			children: [
																				(0, s.jsx)(c.p, {
																					type: "number",
																					min: 0,
																					value: e.qty,
																					onChange: (
																						e
																					) =>
																						B(t, {
																							qty: Number(
																								e
																									.target
																									.value ||
																									0
																							),
																						}),
																					disabled: S,
																				}),
																				(0, s.jsx)(c.p, {
																					type: "number",
																					min: 0,
																					value: e.rate,
																					onChange: (
																						e
																					) =>
																						B(t, {
																							rate: Number(
																								e
																									.target
																									.value ||
																									0
																							),
																						}),
																					disabled: S,
																				}),
																				(0, s.jsx)(c.p, {
																					type: "number",
																					min: 0,
																					value:
																						e.discount_percentage ||
																						0,
																					onChange: (
																						e
																					) =>
																						B(t, {
																							discount_percentage:
																								Number(
																									e
																										.target
																										.value ||
																										0
																								),
																						}),
																					disabled: S,
																				}),
																			],
																	  })
																	: (0, s.jsxs)(s.Fragment, {
																			children: [
																				(0, s.jsx)("div", {
																					className:
																						"text-sm",
																					children:
																						e.qty,
																				}),
																				(0, s.jsx)("div", {
																					className:
																						"text-sm",
																					children:
																						Number(
																							e.rate ||
																								0
																						).toLocaleString(),
																				}),
																				(0, s.jsxs)(
																					"div",
																					{
																						className:
																							"text-sm",
																						children: [
																							Number(
																								e.discount_percentage ||
																									0
																							),
																							"%",
																						],
																					}
																				),
																			],
																	  }),
																(0, s.jsxs)("div", {
																	className:
																		"text-sm font-medium",
																	children: [
																		F,
																		" ",
																		a.toLocaleString(),
																	],
																}),
															],
														},
														`${e.item_code}-${t}`
													);
											  }),
										(0, s.jsxs)("div", {
											className:
												"flex justify-between border-t border-border/70 pt-3 text-sm font-semibold",
											children: [
												(0, s.jsx)("span", {
													children: Z
														? "Estimated total"
														: "Grand total",
												}),
												(0, s.jsxs)("span", {
													children: [
														F,
														" ",
														(Z
															? I
															: Number(
																	j.grand_total ||
																		j.net_total ||
																		0
															  )
														).toLocaleString(),
													],
												}),
											],
										}),
										Z
											? (0, s.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children:
														"Adjust qty / rate if needed, then click Submit Quotation. No Desk required.",
											  })
											: null,
									],
								}),
							],
						}),
						(0, s.jsx)(p.J, {
							open: D,
							onOpenChange: q,
							quotationId: a,
							customer: {
								name: String(j.party_name || ""),
								display: String(j.customer_display || j.party_name || ""),
								email: String(j.customer_email || j.contact_email || ""),
								phone: String(j.customer_mobile || j.contact_mobile || ""),
							},
						}),
						(0, s.jsx)(h.j, {
							open: $,
							onOpenChange: E,
							title: "Submit this quotation?",
							description: `${a} will be submitted. After that it cannot be edited — you can still share it with the customer.`,
							confirmLabel: "Submit quotation",
							cancelLabel: "Keep as draft",
							loading: S,
							onConfirm: () => void Q(),
						}),
					],
				});
			}
			function y({ label: e, children: t }) {
				return (0, s.jsxs)("div", {
					className: "space-y-1.5",
					children: [
						(0, s.jsx)("label", {
							className: "text-xs font-medium text-muted-foreground",
							children: e,
						}),
						(0, s.jsx)("div", { children: t }),
					],
				});
			}
		},
		56204: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("send", [
				[
					"path",
					{
						d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
						key: "1ffxy3",
					},
				],
				["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }],
			]);
		},
		70521: (e, t, a) => {
			a.d(t, {
				$v: () => p,
				EO: () => c,
				Lt: () => l,
				Rx: () => h,
				Zr: () => g,
				ck: () => m,
				r7: () => x,
				wd: () => u,
			});
			var s = a(95155);
			a(12115);
			var r = a(284),
				n = a(91337),
				i = a(4474);
			function l({ ...e }) {
				return (0, s.jsx)(r.bL, { "data-slot": "alert-dialog", ...e });
			}
			function o({ ...e }) {
				return (0, s.jsx)(r.ZL, { "data-slot": "alert-dialog-portal", ...e });
			}
			function d({ className: e, ...t }) {
				return (0, s.jsx)(r.hJ, {
					"data-slot": "alert-dialog-overlay",
					className: (0, n.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, s.jsxs)(o, {
					children: [
						(0, s.jsx)(d, {}),
						(0, s.jsx)(r.UC, {
							"data-slot": "alert-dialog-content",
							className: (0, n.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
								e
							),
							...t,
						}),
					],
				});
			}
			function u({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "alert-dialog-header",
					className: (0, n.cn)("flex flex-col gap-2 text-center sm:text-left", e),
					...t,
				});
			}
			function m({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "alert-dialog-footer",
					className: (0, n.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						e
					),
					...t,
				});
			}
			function x({ className: e, ...t }) {
				return (0, s.jsx)(r.hE, {
					"data-slot": "alert-dialog-title",
					className: (0, n.cn)("text-lg font-semibold", e),
					...t,
				});
			}
			function p({ className: e, ...t }) {
				return (0, s.jsx)(r.VY, {
					"data-slot": "alert-dialog-description",
					className: (0, n.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function h({ className: e, ...t }) {
				return (0, s.jsx)(r.rc, { className: (0, n.cn)((0, i.r)(), e), ...t });
			}
			function g({ className: e, ...t }) {
				return (0, s.jsx)(r.ZD, {
					className: (0, n.cn)((0, i.r)({ variant: "outline" }), e),
					...t,
				});
			}
		},
		80723: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("arrow-left", [
				["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
				["path", { d: "M19 12H5", key: "x3x0zl" }],
			]);
		},
		92289: (e, t, a) => {
			a.d(t, { A: () => s });
			let s = (0, a(90425).A)("mail", [
				["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7", key: "132q7q" }],
				["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2", key: "izxlao" }],
			]);
		},
		93108: (e, t, a) => {
			a.d(t, { B: () => c, y: () => u });
			var s = a(95155),
				r = a(12115),
				n = a(66609),
				i = a(13545),
				l = a(12651),
				o = a(33210),
				d = a(91337);
			function c() {
				let [e, t] = (0, r.useState)(""),
					[a, s] = (0, r.useState)(""),
					i = (0, r.useCallback)((e, a = "Something went wrong.") => {
						let r =
							(e instanceof Error ? e.message : "string" == typeof e ? e : "")
								.replace(/<br\s*\/?>/gi, "\n")
								.replace(/<[^>]*>/g, "")
								.trim() || a;
						return (
							s(""),
							t(r),
							n.o.error(r, { duration: 8e3 }),
							"u" > typeof document &&
								document
									.querySelector("main")
									?.scrollTo({ top: 0, behavior: "smooth" }),
							r
						);
					}, []);
				return {
					error: e,
					success: a,
					showError: i,
					showSuccess: (0, r.useCallback)((e) => {
						t(""), s(e), n.o.success(e);
					}, []),
					clear: (0, r.useCallback)(() => {
						t(""), s("");
					}, []),
				};
			}
			function u({ error: e, success: t, onDismiss: a, className: r }) {
				if (!e && !t) return null;
				let n = !!e;
				return (0, s.jsx)("div", {
					className: (0, d.cn)("sticky top-0 z-40 -mx-1 px-1 pt-1", r),
					children: (0, s.jsxs)("div", {
						role: n ? "alert" : "status",
						"aria-live": n ? "assertive" : "polite",
						className: (0, d.cn)(
							"flex items-start gap-2 rounded-xl border p-3 text-sm shadow-sm backdrop-blur",
							n
								? "border-destructive/40 bg-destructive/10 text-destructive"
								: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
						),
						children: [
							n
								? (0, s.jsx)(i.A, { className: "mt-0.5 h-4 w-4 shrink-0" })
								: (0, s.jsx)(l.A, { className: "mt-0.5 h-4 w-4 shrink-0" }),
							(0, s.jsx)("p", {
								className: "flex-1 whitespace-pre-wrap break-words",
								children: e || t,
							}),
							a
								? (0, s.jsx)("button", {
										type: "button",
										onClick: a,
										"aria-label": "Dismiss message",
										className:
											"rounded p-0.5 opacity-70 transition-opacity hover:opacity-100",
										children: (0, s.jsx)(o.A, { className: "h-4 w-4" }),
								  })
								: null,
						],
					}),
				});
			}
		},
		98790: (e, t, a) => {
			a.d(t, { J: () => m });
			var s = a(95155),
				r = a(9089),
				n = a(92289),
				i = a(4474),
				l = a(74350),
				o = a(91337);
			function d({ className: e }) {
				return (0, s.jsxs)("svg", {
					viewBox: "0 0 24 24",
					className: e,
					"aria-hidden": "true",
					fill: "currentColor",
					children: [
						(0, s.jsx)("path", {
							d: "M17.47 14.38c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.13-.42-2.16-1.33-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.46h-.52c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29s.98 2.66 1.12 2.84c.14.18 1.93 2.95 4.68 4.14.65.28 1.16.45 1.56.58.65.21 1.25.18 1.72.11.52-.08 1.6-.65 1.83-1.28.23-.63.23-1.16.16-1.28-.07-.11-.25-.18-.52-.32z",
						}),
						(0, s.jsx)("path", {
							d: "M12.04 2C6.5 2 2 6.48 2 12c0 1.77.46 3.45 1.28 4.91L2 22l5.23-1.37A9.96 9.96 0 0 0 12.04 22C17.56 22 22 17.52 22 12S17.56 2 12.04 2zm0 18.15c-1.67 0-3.25-.5-4.56-1.35l-.33-.2-3.1.81.83-3.02-.21-.35A8.12 8.12 0 0 1 3.88 12c0-4.5 3.66-8.15 8.16-8.15 4.5 0 8.15 3.65 8.15 8.15 0 4.49-3.65 8.15-8.15 8.15z",
						}),
					],
				});
			}
			function c(e) {
				window.open(e, "_blank", "noopener");
			}
			function u({
				label: e,
				description: t,
				disabled: a,
				onClick: r,
				className: n,
				children: i,
			}) {
				return (0, s.jsxs)("button", {
					type: "button",
					disabled: a,
					onClick: r,
					className: (0, o.cn)(
						"flex flex-1 flex-col items-center gap-2 rounded-2xl border border-border/70 bg-muted/20 px-3 py-4 text-center transition-colors",
						a
							? "cursor-not-allowed opacity-40"
							: "hover:border-primary/40 hover:bg-muted/40"
					),
					children: [
						(0, s.jsx)("span", {
							className: (0, o.cn)(
								"grid h-11 w-11 place-items-center rounded-full text-white shadow-sm",
								a ? "bg-muted text-muted-foreground" : n
							),
							children: i,
						}),
						(0, s.jsx)("span", { className: "text-sm font-medium", children: e }),
						(0, s.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: t,
						}),
					],
				});
			}
			function m({ open: e, onOpenChange: t, quotationId: a, customer: o }) {
				var x, p;
				let h,
					g,
					b,
					f,
					j,
					y,
					v = o.display || o.name || "Customer",
					N =
						((x = a),
						(h = (p = o).display || p.name || "Customer"),
						(g = (p.email || "").trim()),
						(f = (b = (p.phone || "").trim()).replace(/\D/g, "")),
						(j = encodeURIComponent(`Quotation ${x}`)),
						(y = encodeURIComponent(`Hello ${h},

Please find quotation ${x}.
`)),
						{
							email: g,
							phone: b,
							phoneDigits: f,
							whatsapp: f ? `https://wa.me/${f}?text=${y}` : "",
							sms: f ? `sms:${f}?body=${y}` : "",
							mailto: g ? `mailto:${g}?subject=${j}&body=${y}` : "",
						});
				return (0, s.jsx)(l.lG, {
					open: e,
					onOpenChange: t,
					children: (0, s.jsxs)(l.Cf, {
						className: "sm:max-w-md",
						children: [
							(0, s.jsxs)(l.c7, {
								children: [
									(0, s.jsx)(l.L3, { children: "Send to Customer" }),
									(0, s.jsx)(l.rr, {
										children:
											"Uses the customer on this quotation. WhatsApp and SMS need a phone number; email needs an address.",
									}),
								],
							}),
							(0, s.jsxs)("div", {
								className: "rounded-xl border border-border/70 p-3 text-sm",
								children: [
									(0, s.jsx)("p", { className: "font-medium", children: v }),
									o.name && o.name !== v
										? (0, s.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: o.name,
										  })
										: null,
									(0, s.jsx)("p", {
										className: "mt-2 text-muted-foreground",
										children: N.email || "No email on file",
									}),
									(0, s.jsx)("p", {
										className: "text-muted-foreground",
										children: N.phone || "No phone on file",
									}),
								],
							}),
							(0, s.jsxs)("div", {
								className: "flex gap-2",
								children: [
									(0, s.jsx)(u, {
										label: "WhatsApp",
										description: N.phone ? N.phone : "Needs a phone number",
										disabled: !N.whatsapp,
										className: "bg-[#25D366]",
										onClick: () => N.whatsapp && c(N.whatsapp),
										children: (0, s.jsx)(d, { className: "h-5 w-5" }),
									}),
									(0, s.jsx)(u, {
										label: "SMS",
										description: N.phone ? N.phone : "Needs a phone number",
										disabled: !N.sms,
										className: "bg-sky-600",
										onClick: () => N.sms && c(N.sms),
										children: (0, s.jsx)(r.A, { className: "h-5 w-5" }),
									}),
									(0, s.jsx)(u, {
										label: "Email",
										description: N.email || "Needs an email",
										disabled: !N.mailto,
										className: "bg-primary",
										onClick: () => N.mailto && c(N.mailto),
										children: (0, s.jsx)(n.A, { className: "h-5 w-5" }),
									}),
								],
							}),
							(0, s.jsx)(i.$, {
								variant: "outline",
								onClick: () => t(!1),
								children: "Close",
							}),
						],
					}),
				});
			}
		},
	},
]);
