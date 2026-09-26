"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[6414],
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
		26414: (e, s, t) => {
			t.r(s), t.d(s, { default: () => h });
			var a = t(95155),
				r = t(12115),
				n = t(44855),
				l = t(32144),
				c = t(55833),
				i = t(4474),
				o = t(79984),
				d = t(39658),
				m = t(39540),
				u = t(42074),
				x = t(10086),
				p = t(93108),
				g = t(6296);
			function h() {
				let { navigate: e } = (0, c.c)(),
					{ data: s } = (0, n.Ay)("crm-segment-form-options", l.ET),
					[t, h] = (0, r.useState)(!1),
					[b, f] = (0, r.useState)(null),
					{ error: _, success: y, showError: v, showSuccess: j, clear: k } = (0, p.B)(),
					[N, w] = (0, r.useState)({
						segment_name: "",
						status: "Active",
						customer_type: "",
						city: "",
						preferred_language: "",
						brand: "",
						retention_category: "",
						sales_status: "",
						channel_preference: "",
						loyalty_tier: "",
						require_marketing_consent: !0,
						include_do_not_contact: !1,
						has_deferred_work: !1,
						has_complaint_history: !1,
						notes: "",
					}),
					C = (e, s) => w((t) => ({ ...t, [e]: s })),
					S = (e) => (e || []).filter(Boolean).map((e) => ({ value: e, label: e })),
					A = () => ({
						segment_name: N.segment_name.trim(),
						status: N.status,
						customer_type: N.customer_type || null,
						city: N.city || null,
						preferred_language: N.preferred_language || null,
						brand: N.brand || null,
						retention_category: N.retention_category || null,
						sales_status: N.sales_status || null,
						channel_preference: N.channel_preference || null,
						loyalty_tier: N.loyalty_tier || null,
						require_marketing_consent: +!!N.require_marketing_consent,
						include_do_not_contact: +!!N.include_do_not_contact,
						has_deferred_work: +!!N.has_deferred_work,
						has_complaint_history: +!!N.has_complaint_history,
						notes: N.notes || null,
					}),
					q = async () => {
						k();
						try {
							let e = await (0, l.sb)({ data: A() });
							f(Number(e.count || 0)), j(`Preview audience: ${e.count} customers`);
						} catch (e) {
							v(e, "Preview failed");
						}
					},
					B = async () => {
						if ((k(), !N.segment_name.trim()))
							return void v("Segment name is required.");
						h(!0);
						try {
							let s = await (0, l.er)(A());
							e("crm-segment-detail", { id: String(s.name) });
						} catch (e) {
							v(e, "Failed to create segment");
						} finally {
							h(!1);
						}
					};
				return (0, a.jsxs)("div", {
					className: "dms-form-page space-y-4",
					children: [
						(0, a.jsx)(p.y, { error: _, success: y, onDismiss: k }),
						(0, a.jsxs)(o.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, a.jsx)(o.aR, {
									children: (0, a.jsx)(o.ZB, {
										className: "text-base",
										children: "New segment (\xa713.2)",
									}),
								}),
								(0, a.jsxs)(o.Wu, {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										(0, a.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Name *",
												}),
												(0, a.jsx)(d.p, {
													value: N.segment_name,
													onChange: (e) =>
														C("segment_name", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Customer type",
												}),
												(0, a.jsx)(x.Zi, {
													options: S(s?.customer_types),
													value: N.customer_type,
													onValueChange: (e) =>
														C("customer_type", e || ""),
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
												(0, a.jsx)(d.p, {
													value: N.city,
													onChange: (e) => C("city", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Brand",
												}),
												(0, a.jsx)(d.p, {
													value: N.brand,
													onChange: (e) => C("brand", e.target.value),
													placeholder: "Brand name",
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Retention category",
												}),
												(0, a.jsx)(x.Zi, {
													options: S(s?.retention_categories),
													value: N.retention_category,
													onValueChange: (e) =>
														C("retention_category", e || ""),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Sales status",
												}),
												(0, a.jsx)(x.Zi, {
													options: S(s?.sales_statuses),
													value: N.sales_status,
													onValueChange: (e) =>
														C("sales_status", e || ""),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Channel preference",
												}),
												(0, a.jsx)(x.Zi, {
													options: S(s?.channels),
													value: N.channel_preference,
													onValueChange: (e) =>
														C("channel_preference", e || ""),
												}),
											],
										}),
										(0, a.jsx)("div", {
											className: "flex flex-wrap gap-4 sm:col-span-2",
											children: [
												[
													"require_marketing_consent",
													"Require marketing consent",
												],
												[
													"include_do_not_contact",
													"Include do-not-contact",
												],
												["has_deferred_work", "Has deferred work"],
												["has_complaint_history", "Has complaint history"],
											].map(([e, s]) =>
												(0, a.jsxs)(
													"label",
													{
														className:
															"flex items-center gap-2 text-sm",
														children: [
															(0, a.jsx)("input", {
																type: "checkbox",
																checked: !!N[e],
																onChange: (s) =>
																	C(e, s.target.checked),
															}),
															s,
														],
													},
													e
												)
											),
										}),
										(0, a.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Notes",
												}),
												(0, a.jsx)(m.T, {
													rows: 2,
													value: N.notes,
													onChange: (e) => C("notes", e.target.value),
												}),
											],
										}),
										null != b
											? (0, a.jsxs)("p", {
													className:
														"sm:col-span-2 text-sm text-muted-foreground",
													children: [
														"Last preview: ",
														(0, a.jsx)("span", {
															className:
																"font-medium text-foreground",
															children: b,
														}),
														" ",
														"customers",
													],
											  })
											: null,
									],
								}),
							],
						}),
						(0, a.jsxs)(u.h, {
							align: "between",
							children: [
								(0, a.jsx)(i.$, {
									variant: "outline",
									onClick: () => e("crm-campaigns"),
									children: "Cancel",
								}),
								(0, a.jsxs)("div", {
									className: "flex gap-2",
									children: [
										(0, a.jsx)(i.$, {
											variant: "outline",
											onClick: () => void q(),
											children: "Preview audience",
										}),
										(0, a.jsxs)(i.$, {
											onClick: () => void B(),
											disabled: t,
											children: [
												t
													? (0, a.jsx)(g.A, {
															className: "mr-2 h-4 w-4 animate-spin",
													  })
													: null,
												"Create segment",
											],
										}),
									],
								}),
							],
						}),
					],
				});
			}
		},
		39540: (e, s, t) => {
			t.d(s, { T: () => n });
			var a = t(95155);
			t(12115);
			var r = t(91337);
			function n({ className: e, ...s }) {
				return (0, a.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, r.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...s,
				});
			}
		},
		42074: (e, s, t) => {
			t.d(s, { h: () => c });
			var a = t(95155),
				r = t(12115),
				n = t(47650),
				l = t(91337);
			function c({ children: e, className: s, align: t = "end" }) {
				let [i, o] = (0, r.useState)(!1);
				(0, r.useEffect)(() => (o(!0), () => o(!1)), []);
				let d = (0, a.jsx)("div", {
					role: "toolbar",
					"aria-label": "Form actions",
					className: (0, l.cn)(
						"fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_24px_rgba(15,61,94,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-card/90",
						"pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3",
						"lg:left-64",
						s
					),
					children: (0, a.jsx)("div", {
						className: (0, l.cn)(
							"mx-auto w-full max-w-[1600px] px-3 sm:px-4 lg:px-6",
							"between" === t
								? "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3"
								: "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3"
						),
						children: e,
					}),
				});
				return i ? (0, n.createPortal)(d, document.body) : null;
			}
		},
		93108: (e, s, t) => {
			t.d(s, { B: () => d, y: () => m });
			var a = t(95155),
				r = t(12115),
				n = t(66609),
				l = t(13545),
				c = t(12651),
				i = t(33210),
				o = t(91337);
			function d() {
				let [e, s] = (0, r.useState)(""),
					[t, a] = (0, r.useState)(""),
					l = (0, r.useCallback)((e, t = "Something went wrong.") => {
						let r =
							(e instanceof Error ? e.message : "string" == typeof e ? e : "")
								.replace(/<br\s*\/?>/gi, "\n")
								.replace(/<[^>]*>/g, "")
								.trim() || t;
						return (
							a(""),
							s(r),
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
					success: t,
					showError: l,
					showSuccess: (0, r.useCallback)((e) => {
						s(""), a(e), n.o.success(e);
					}, []),
					clear: (0, r.useCallback)(() => {
						s(""), a("");
					}, []),
				};
			}
			function m({ error: e, success: s, onDismiss: t, className: r }) {
				if (!e && !s) return null;
				let n = !!e;
				return (0, a.jsx)("div", {
					className: (0, o.cn)("sticky top-0 z-40 -mx-1 px-1 pt-1", r),
					children: (0, a.jsxs)("div", {
						role: n ? "alert" : "status",
						"aria-live": n ? "assertive" : "polite",
						className: (0, o.cn)(
							"flex items-start gap-2 rounded-xl border p-3 text-sm shadow-sm backdrop-blur",
							n
								? "border-destructive/40 bg-destructive/10 text-destructive"
								: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
						),
						children: [
							n
								? (0, a.jsx)(l.A, { className: "mt-0.5 h-4 w-4 shrink-0" })
								: (0, a.jsx)(c.A, { className: "mt-0.5 h-4 w-4 shrink-0" }),
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
										children: (0, a.jsx)(i.A, { className: "h-4 w-4" }),
								  })
								: null,
						],
					}),
				});
			}
		},
	},
]);
