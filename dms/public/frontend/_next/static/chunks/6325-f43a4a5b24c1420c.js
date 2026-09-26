"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[6325],
	{
		12651: (e, a, t) => {
			t.d(a, { A: () => l });
			let l = (0, t(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, a, t) => {
			t.d(a, { A: () => l });
			let l = (0, t(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		21628: (e, a, t) => {
			t.d(a, { A: () => l });
			let l = (0, t(90425).A)("arrow-right", [
				["path", { d: "M5 12h14", key: "1ays0h" }],
				["path", { d: "m12 5 7 7-7 7", key: "xquz4c" }],
			]);
		},
		23511: (e, a, t) => {
			t.d(a, { E: () => n });
			var l = t(95155),
				r = t(91337);
			function n({ className: e, ...a }) {
				return (0, l.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, r.cn)("bg-accent animate-pulse rounded-md", e),
					...a,
				});
			}
		},
		26372: (e, a, t) => {
			t.d(a, { I: () => d, z: () => c });
			var l = t(95155),
				r = t(6296),
				n = t(4474),
				s = t(74350),
				i = t(39658),
				o = t(39540);
			function c({
				open: e,
				onOpenChange: a,
				title: t = "Add Note",
				description: d = "Write a short note and save.",
				noteTitle: u = "",
				noteContent: m,
				onNoteTitleChange: h,
				onNoteContentChange: x,
				onSave: g,
				saving: p = !1,
				showTitleField: v = !1,
				saveLabel: b = "Save Note",
			}) {
				return (0, l.jsx)(s.lG, {
					open: e,
					onOpenChange: a,
					children: (0, l.jsxs)(s.Cf, {
						className: "sm:max-w-md",
						children: [
							(0, l.jsxs)(s.c7, {
								children: [
									(0, l.jsx)(s.L3, { children: t }),
									(0, l.jsx)(s.rr, { children: d }),
								],
							}),
							(0, l.jsxs)("div", {
								className: "space-y-3",
								children: [
									v
										? (0, l.jsx)(i.p, {
												placeholder: "Title",
												value: u,
												onChange: (e) => h?.(e.target.value),
												autoFocus: !0,
										  })
										: null,
									(0, l.jsx)(o.T, {
										placeholder: "Write your note…",
										rows: 4,
										value: m,
										onChange: (e) => x(e.target.value),
										autoFocus: !v,
									}),
								],
							}),
							(0, l.jsxs)(s.Es, {
								children: [
									(0, l.jsx)(n.$, {
										variant: "outline",
										onClick: () => a(!1),
										disabled: p,
										children: "Cancel",
									}),
									(0, l.jsxs)(n.$, {
										onClick: g,
										disabled: p || !m.trim(),
										children: [
											p
												? (0, l.jsx)(r.A, {
														className: "mr-2 h-4 w-4 animate-spin",
												  })
												: null,
											b,
										],
									}),
								],
							}),
						],
					}),
				});
			}
			function d({
				open: e,
				onOpenChange: a,
				title: t = "Add Task",
				description: c = "Create a follow-up task linked to this record.",
				subject: u,
				notes: m,
				due: h = "",
				onSubjectChange: x,
				onNotesChange: g,
				onDueChange: p,
				onSave: v,
				saving: b = !1,
				showDueField: j = !0,
			}) {
				return (0, l.jsx)(s.lG, {
					open: e,
					onOpenChange: a,
					children: (0, l.jsxs)(s.Cf, {
						className: "sm:max-w-md",
						children: [
							(0, l.jsxs)(s.c7, {
								children: [
									(0, l.jsx)(s.L3, { children: t }),
									(0, l.jsx)(s.rr, { children: c }),
								],
							}),
							(0, l.jsxs)("div", {
								className: "space-y-3",
								children: [
									(0, l.jsx)(i.p, {
										placeholder: "Subject",
										value: u,
										onChange: (e) => x(e.target.value),
										autoFocus: !0,
									}),
									(0, l.jsx)(o.T, {
										placeholder: "Notes…",
										rows: 3,
										value: m,
										onChange: (e) => g(e.target.value),
									}),
									j
										? (0, l.jsx)(i.p, {
												type: "datetime-local",
												value: h,
												onChange: (e) => p?.(e.target.value),
										  })
										: null,
								],
							}),
							(0, l.jsxs)(s.Es, {
								children: [
									(0, l.jsx)(n.$, {
										variant: "outline",
										onClick: () => a(!1),
										disabled: b,
										children: "Cancel",
									}),
									(0, l.jsxs)(n.$, {
										onClick: v,
										disabled: b || !u.trim(),
										children: [
											b
												? (0, l.jsx)(r.A, {
														className: "mr-2 h-4 w-4 animate-spin",
												  })
												: null,
											"Save Task",
										],
									}),
								],
							}),
						],
					}),
				});
			}
		},
		38291: (e, a, t) => {
			t.d(a, { E: () => o });
			var l = t(95155);
			t(12115);
			var r = t(42442),
				n = t(18460),
				s = t(91337);
			let i = (0, n.F)(
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
			function o({ className: e, variant: a, asChild: t = !1, ...n }) {
				let c = t ? r.DX : "span";
				return (0, l.jsx)(c, {
					"data-slot": "badge",
					className: (0, s.cn)(i({ variant: a }), e),
					...n,
				});
			}
		},
		39540: (e, a, t) => {
			t.d(a, { T: () => n });
			var l = t(95155);
			t(12115);
			var r = t(91337);
			function n({ className: e, ...a }) {
				return (0, l.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, r.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...a,
				});
			}
		},
		44605: (e, a, t) => {
			t.d(a, { A: () => l });
			let l = (0, t(90425).A)("phone-incoming", [
				["path", { d: "M16 2v6h6", key: "1mfrl5" }],
				["path", { d: "m22 2-6 6", key: "6f0sa0" }],
				[
					"path",
					{
						d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
						key: "9njp5v",
					},
				],
			]);
		},
		45274: (e, a, t) => {
			t.d(a, { L: () => c });
			var l = t(95155),
				r = t(12115),
				n = t(44855),
				s = t(32144),
				i = t(55833),
				o = t(10086);
			function c({
				value: e,
				onValueChange: a,
				valueLabel: t,
				placeholder: d = "Select a lead (optional)…",
				disabled: u,
				className: m,
				allowCreate: h = !0,
				presetOptions: x,
			}) {
				let { navigate: g } = (0, i.c)(),
					[p, v] = (0, r.useState)(""),
					[b, j] = (0, r.useState)(t || ""),
					{ data: f, isLoading: y } = (0, n.Ay)(["crm-link-leads", p], () =>
						(0, s.AP)({ search: p || void 0, limit: 50 })
					),
					N = (0, r.useMemo)(
						() =>
							(f?.data || []).map((e) => ({
								value: String(e.name),
								label: String(e.lead_name || e.organization_name || e.name),
								description: [e.mobile_no || e.phone, e.status, e.name]
									.filter(Boolean)
									.map(String)
									.join(" \xb7 "),
								mobile: String(e.mobile_no || e.phone || ""),
							})),
						[f]
					),
					_ = (0, r.useMemo)(() => {
						let e = new Map();
						for (let a of x || []) a?.value && e.set(a.value, a);
						for (let a of N) e.set(a.value, a);
						let a = Array.from(e.values());
						if (!p.trim()) return a;
						let t = p.trim().toLowerCase();
						return a.filter(
							(e) =>
								e.label.toLowerCase().includes(t) ||
								e.value.toLowerCase().includes(t) ||
								(e.description || "").toLowerCase().includes(t)
						);
					}, [x, N, p]),
					C = (e && (b || t)) || _.find((a) => a.value === e)?.label || void 0;
				return (0, l.jsx)(o.Zi, {
					className: m,
					options: _,
					value: e,
					valueLabel: C,
					onValueChange: (e) => {
						if (!e) {
							j(""), a("", void 0, { mobile: "" });
							return;
						}
						let t = _.find((a) => a.value === e);
						t && (j(t.label), a(t.value, t.label, { mobile: t.mobile }));
					},
					onSearchChange: v,
					placeholder: d,
					emptyMessage: "No leads found — create a lead first or clear search",
					isLoading: y,
					disabled: u,
					onCreateNew: h ? () => g("crm-lead-new") : void 0,
					createNewLabel: "Create lead",
				});
			}
		},
		49155: (e, a, t) => {
			t.d(a, { A: () => l });
			let l = (0, t(90425).A)("phone-outgoing", [
				["path", { d: "m16 8 6-6", key: "oawc05" }],
				["path", { d: "M22 8V2h-6", key: "oqy2zc" }],
				[
					"path",
					{
						d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
						key: "9njp5v",
					},
				],
			]);
		},
		80723: (e, a, t) => {
			t.d(a, { A: () => l });
			let l = (0, t(90425).A)("arrow-left", [
				["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
				["path", { d: "M19 12H5", key: "x3x0zl" }],
			]);
		},
		81672: (e, a, t) => {
			t.d(a, { Ge: () => u, N0: () => c, Yq: () => i, gQ: () => d, r6: () => o });
			let l = [
					"January",
					"February",
					"March",
					"April",
					"May",
					"June",
					"July",
					"August",
					"September",
					"October",
					"November",
					"December",
				],
				r = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
				n = (e) => String(e).padStart(2, "0");
			function s(e) {
				if (null == e || "" === e) return null;
				if (e instanceof Date) return Number.isNaN(e.getTime()) ? null : e;
				if ("number" == typeof e) {
					let a = new Date(e);
					return Number.isNaN(a.getTime()) ? null : a;
				}
				let a = String(e).trim();
				if (!a) return null;
				let t = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(a);
				if (t) return new Date(Number(t[1]), Number(t[2]) - 1, Number(t[3]));
				let l = new Date(a.includes(" ") && !a.includes("T") ? a.replace(" ", "T") : a);
				return Number.isNaN(l.getTime()) ? null : l;
			}
			function i(e, a = "") {
				let t = s(e);
				return t ? `${n(t.getDate())}/${n(t.getMonth() + 1)}/${t.getFullYear()}` : a;
			}
			function o(e, a = "", t = !1) {
				let l = s(e);
				if (!l) return a;
				let r = `${n(l.getHours())}:${n(l.getMinutes())}${
					t ? `:${n(l.getSeconds())}` : ""
				}`;
				return `${i(l)} ${r}`;
			}
			function c(e, a = "") {
				let t = s(e);
				return t ? `${l[t.getMonth()]} ${t.getFullYear()}` : a;
			}
			function d(e, a = "") {
				let t = s(e);
				return t ? r[t.getDay()] : a;
			}
			function u(e, a = "") {
				let t = s(e);
				return t ? `${r[t.getDay()]}, ${i(t)}` : a;
			}
		},
		93108: (e, a, t) => {
			t.d(a, { B: () => d, y: () => u });
			var l = t(95155),
				r = t(12115),
				n = t(66609),
				s = t(13545),
				i = t(12651),
				o = t(33210),
				c = t(91337);
			function d() {
				let [e, a] = (0, r.useState)(""),
					[t, l] = (0, r.useState)(""),
					s = (0, r.useCallback)((e, t = "Something went wrong.") => {
						let r =
							(e instanceof Error ? e.message : "string" == typeof e ? e : "")
								.replace(/<br\s*\/?>/gi, "\n")
								.replace(/<[^>]*>/g, "")
								.trim() || t;
						return (
							l(""),
							a(r),
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
					showError: s,
					showSuccess: (0, r.useCallback)((e) => {
						a(""), l(e), n.o.success(e);
					}, []),
					clear: (0, r.useCallback)(() => {
						a(""), l("");
					}, []),
				};
			}
			function u({ error: e, success: a, onDismiss: t, className: r }) {
				if (!e && !a) return null;
				let n = !!e;
				return (0, l.jsx)("div", {
					className: (0, c.cn)("sticky top-0 z-40 -mx-1 px-1 pt-1", r),
					children: (0, l.jsxs)("div", {
						role: n ? "alert" : "status",
						"aria-live": n ? "assertive" : "polite",
						className: (0, c.cn)(
							"flex items-start gap-2 rounded-xl border p-3 text-sm shadow-sm backdrop-blur",
							n
								? "border-destructive/40 bg-destructive/10 text-destructive"
								: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
						),
						children: [
							n
								? (0, l.jsx)(s.A, { className: "mt-0.5 h-4 w-4 shrink-0" })
								: (0, l.jsx)(i.A, { className: "mt-0.5 h-4 w-4 shrink-0" }),
							(0, l.jsx)("p", {
								className: "flex-1 whitespace-pre-wrap break-words",
								children: e || a,
							}),
							t
								? (0, l.jsx)("button", {
										type: "button",
										onClick: t,
										"aria-label": "Dismiss message",
										className:
											"rounded p-0.5 opacity-70 transition-opacity hover:opacity-100",
										children: (0, l.jsx)(o.A, { className: "h-4 w-4" }),
								  })
								: null,
						],
					}),
				});
			}
		},
		96325: (e, a, t) => {
			t.r(a), t.d(a, { default: () => C });
			var l = t(95155),
				r = t(81672),
				n = t(12115),
				s = t(44855),
				i = t(32144),
				o = t(55833),
				c = t(4474),
				d = t(79984),
				u = t(39658),
				m = t(23511),
				h = t(38291),
				x = t(10086),
				g = t(26372),
				p = t(45274),
				v = t(97426),
				b = t(93108),
				j = t(80723),
				f = t(51914),
				y = t(44605),
				N = t(49155),
				_ = t(21628);
			function C() {
				let { navigate: e, viewParams: a } = (0, o.c)(),
					t = a.get("id") || "",
					{
						data: C,
						isLoading: k,
						mutate: A,
						error: $,
					} = (0, s.Ay)(t ? ["crm-call-log", t] : null, () => (0, i.IW)(t)),
					{ data: L } = (0, s.Ay)("crm-call-log-options", i.L5),
					[M, T] = (0, n.useState)(!1),
					{ error: F, success: D, showError: E, showSuccess: z, clear: Z } = (0, b.B)(),
					[O, B] = (0, n.useState)(!1),
					[V, I] = (0, n.useState)(!1),
					[R, q] = (0, n.useState)(!1),
					[J, W] = (0, n.useState)(""),
					[G, H] = (0, n.useState)(""),
					[Y, P] = (0, n.useState)(""),
					[Q, X] = (0, n.useState)(""),
					[U, K] = (0, n.useState)(""),
					[ee, ea] = (0, n.useState)({}),
					et = C?._notes || [],
					el = C?._tasks || [],
					er = (0, n.useMemo)(
						() => (L?.statuses || []).map((e) => ({ value: e, label: e })),
						[L]
					),
					en = (0, n.useMemo)(
						() => (L?.types || []).map((e) => ({ value: e, label: e })),
						[L]
					),
					es = (0, n.useMemo)(() => L?.users || [], [L]);
				async function ei() {
					if (t) {
						T(!0), Z();
						try {
							await (0, i._L)(t, {
								from: ee.from,
								to: ee.to,
								type: ee.type,
								status: ee.status,
								duration: ee.duration ? Number(ee.duration) : 0,
								start_time: ee.start_time || null,
								end_time: ee.end_time || null,
								caller: ee.caller || null,
								receiver: ee.receiver || null,
								recording_url: ee.recording_url || null,
								lead: ee.lead || null,
								contact: ee.contact || null,
							}),
								B(!1),
								await A(),
								z("Call log updated.");
						} catch (e) {
							E(e, "Failed to update call log.");
						} finally {
							T(!1);
						}
					}
				}
				async function eo() {
					if (t) {
						T(!0), Z();
						try {
							let e = et[0];
							await (0, i.$P)(t, {
								name: e?.name,
								title: J || "Call Note",
								content: G,
							}),
								I(!1),
								W(""),
								H(""),
								await A(),
								z("Note saved.");
						} catch (e) {
							E(e, "Failed to save note.");
						} finally {
							T(!1);
						}
					}
				}
				async function ec() {
					if (!t || !Y.trim()) return void E("Task subject is required.");
					T(!0), Z();
					try {
						await (0, i.kk)(t, {
							subject: Y,
							outcome_notes: Q,
							due_datetime: U || null,
							activity_type: "Call",
						}),
							q(!1),
							P(""),
							X(""),
							K(""),
							await A(),
							z("Task created.");
					} catch (e) {
						E(e, "Failed to save task.");
					} finally {
						T(!1);
					}
				}
				async function ed() {
					if (t) {
						T(!0), Z();
						try {
							let a = await (0, i.ry)(t);
							await A();
							let l = a?.lead;
							if (l) return void e("crm-lead-detail", { id: l });
							z("Lead created from call.");
						} catch (e) {
							E(e, "Failed to create lead.");
						} finally {
							T(!1);
						}
					}
				}
				if (!t)
					return (0, l.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Missing call log id.",
					});
				if (k) return (0, l.jsx)(m.E, { className: "h-64" });
				if ($ || !C)
					return (0, l.jsxs)("div", {
						className: "space-y-3",
						children: [
							(0, l.jsxs)(c.$, {
								variant: "outline",
								onClick: () => e("crm-call-logs"),
								children: [(0, l.jsx)(j.A, { className: "mr-2 h-4 w-4" }), "Back"],
							}),
							(0, l.jsx)("p", {
								className: "text-sm text-destructive",
								children: $ instanceof Error ? $.message : "Call log not found.",
							}),
						],
					});
				let eu = "Incoming" === C.type;
				return (0, l.jsxs)("div", {
					className: "space-y-4",
					children: [
						(0, l.jsx)(b.y, { error: F, success: D, onDismiss: Z }),
						(0, l.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [
								(0, l.jsxs)(c.$, {
									variant: "outline",
									onClick: () => e("crm-call-logs"),
									disabled: M,
									children: [
										(0, l.jsx)(j.A, { className: "mr-2 h-4 w-4" }),
										"Call Logs",
									],
								}),
								(0, l.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [
										O
											? (0, l.jsxs)(l.Fragment, {
													children: [
														(0, l.jsx)(c.$, {
															variant: "outline",
															onClick: () => B(!1),
															disabled: M,
															children: "Cancel",
														}),
														(0, l.jsx)(c.$, {
															onClick: ei,
															disabled: M,
															children: "Save",
														}),
													],
											  })
											: (0, l.jsx)(c.$, {
													variant: "outline",
													onClick: function () {
														C &&
															(ea({
																from: String(C.from || ""),
																to: String(C.to || ""),
																type: String(C.type || "Outgoing"),
																status: String(
																	C.status || "Completed"
																),
																duration: String(C.duration ?? ""),
																start_time: String(
																	C.start_time || ""
																).slice(0, 16),
																end_time: String(
																	C.end_time || ""
																).slice(0, 16),
																caller: String(C.caller || ""),
																receiver: String(C.receiver || ""),
																recording_url: String(
																	C.recording_url || ""
																),
																lead: String(
																	C._lead ||
																		("DMS CRM Lead" ===
																		C.reference_doctype
																			? C.reference_docname
																			: "") ||
																		""
																),
																lead_label: String(
																	C._lead_label || ""
																),
																contact: String(
																	C._contact ||
																		("Contact" ===
																		C.reference_doctype
																			? C.reference_docname
																			: "") ||
																		""
																),
																contact_label: String(
																	C._contact_label || ""
																),
															}),
															B(!0));
													},
													disabled: M,
													children: "Edit Call Log",
											  }),
										(0, l.jsx)(c.$, {
											variant: "outline",
											onClick: () => {
												let e = et[0];
												W(J || String(e?.title || "")),
													H(
														G ||
															String(e?.content || "").replace(
																/<[^>]*>/g,
																""
															)
													),
													I(!0);
											},
											disabled: M,
											children: et.length ? "Edit Note" : "Add Note",
										}),
										(0, l.jsxs)(c.$, {
											variant: "outline",
											onClick: () => {
												P(""), X(""), K(""), q(!0);
											},
											disabled: M,
											children: [
												(0, l.jsx)(f.A, { className: "mr-2 h-4 w-4" }),
												"Add Task",
											],
										}),
										C._lead || C._deal
											? null
											: (0, l.jsx)(c.$, {
													onClick: ed,
													disabled: M,
													children: "Create Lead",
											  }),
									],
								}),
							],
						}),
						(0, l.jsxs)(d.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, l.jsx)(d.aR, {
									className: "pb-3",
									children: (0, l.jsxs)(d.ZB, {
										className: "flex items-center gap-2 text-base",
										children: [
											eu
												? (0, l.jsx)(y.A, { className: "h-4 w-4" })
												: (0, l.jsx)(N.A, { className: "h-4 w-4" }),
											"Call Details",
										],
									}),
								}),
								(0, l.jsx)(d.Wu, {
									className: "space-y-4 text-sm",
									children: O
										? (0, l.jsxs)("div", {
												className: "grid gap-3 sm:grid-cols-2",
												children: [
													(0, l.jsx)(w, {
														label: "From",
														children: (0, l.jsx)(u.p, {
															value: ee.from,
															onChange: (e) =>
																ea((a) => ({
																	...a,
																	from: e.target.value,
																})),
														}),
													}),
													(0, l.jsx)(w, {
														label: "To",
														children: (0, l.jsx)(u.p, {
															value: ee.to,
															onChange: (e) =>
																ea((a) => ({
																	...a,
																	to: e.target.value,
																})),
														}),
													}),
													(0, l.jsx)(w, {
														label: "Type",
														children: (0, l.jsx)(x.Zi, {
															options: en,
															value: ee.type,
															onValueChange: (e) =>
																ea((a) => ({
																	...a,
																	type: e || "",
																})),
														}),
													}),
													(0, l.jsx)(w, {
														label: "Status",
														children: (0, l.jsx)(x.Zi, {
															options: er,
															value: ee.status,
															onValueChange: (e) =>
																ea((a) => ({
																	...a,
																	status: e || "",
																})),
														}),
													}),
													(0, l.jsx)(w, {
														label: "Duration (seconds)",
														children: (0, l.jsx)(u.p, {
															type: "number",
															value: ee.duration,
															onChange: (e) =>
																ea((a) => ({
																	...a,
																	duration: e.target.value,
																})),
														}),
													}),
													(0, l.jsx)(w, {
														label:
															"Incoming" === ee.type
																? "Received by"
																: "Caller",
														children: (0, l.jsx)(x.Zi, {
															options: es,
															value:
																"Incoming" === ee.type
																	? ee.receiver
																	: ee.caller,
															onValueChange: (e) =>
																ea((a) =>
																	"Incoming" === a.type
																		? {
																				...a,
																				receiver: e || "",
																		  }
																		: { ...a, caller: e || "" }
																),
															placeholder: "Select user…",
														}),
													}),
													(0, l.jsx)(w, {
														label: "Start",
														children: (0, l.jsx)(u.p, {
															type: "datetime-local",
															value: ee.start_time,
															onChange: (e) =>
																ea((a) => ({
																	...a,
																	start_time: e.target.value,
																})),
														}),
													}),
													(0, l.jsx)(w, {
														label: "End",
														children: (0, l.jsx)(u.p, {
															type: "datetime-local",
															value: ee.end_time,
															onChange: (e) =>
																ea((a) => ({
																	...a,
																	end_time: e.target.value,
																})),
														}),
													}),
													(0, l.jsx)(w, {
														label: "Lead (optional)",
														children: (0, l.jsx)(p.L, {
															value: ee.lead || "",
															valueLabel: ee.lead_label,
															presetOptions: L?.leads,
															onValueChange: (e, a, t) =>
																ea((l) => ({
																	...l,
																	lead: e || "",
																	lead_label: a || "",
																	contact: e ? "" : l.contact,
																	contact_label: e
																		? ""
																		: l.contact_label,
																	to: t?.mobile || l.to,
																})),
															placeholder: "Select a lead…",
														}),
													}),
													(0, l.jsx)(w, {
														label: "Contact",
														children: (0, l.jsx)(v.x, {
															value: ee.contact || "",
															valueLabel: ee.contact_label,
															onValueChange: (e, a, t) =>
																ea((l) => ({
																	...l,
																	contact: e || "",
																	contact_label: a || "",
																	lead: e ? "" : l.lead,
																	lead_label: e
																		? ""
																		: l.lead_label,
																	to: t?.mobile || l.to,
																})),
															placeholder: "Or link a contact…",
														}),
													}),
													(0, l.jsx)(w, {
														label: "Recording URL",
														children: (0, l.jsx)(u.p, {
															value: ee.recording_url,
															onChange: (e) =>
																ea((a) => ({
																	...a,
																	recording_url: e.target.value,
																})),
														}),
													}),
												],
										  })
										: (0, l.jsxs)(l.Fragment, {
												children: [
													(0, l.jsx)(S, {
														label: "Direction",
														children: (0, l.jsxs)("span", {
															className:
																"inline-flex items-center gap-2",
															children: [
																C._caller?.label || "—",
																(0, l.jsx)(_.A, {
																	className:
																		"h-3.5 w-3.5 text-muted-foreground",
																}),
																C._receiver?.label || "—",
															],
														}),
													}),
													(0, l.jsx)(S, {
														label: "From",
														children: C.from || "—",
													}),
													(0, l.jsx)(S, {
														label: "To",
														children: C.to || "—",
													}),
													(0, l.jsx)(S, {
														label: "Type",
														children: C.type || "—",
													}),
													(0, l.jsx)(S, {
														label: "Status",
														children: (0, l.jsx)(h.E, {
															variant: "secondary",
															children:
																C.status_label || C.status || "—",
														}),
													}),
													(0, l.jsx)(S, {
														label: "Duration",
														children: C._duration || "—",
													}),
													(0, l.jsx)(S, {
														label: "Medium",
														children:
															C.telephony_medium ||
															C.medium ||
															"Manual",
													}),
													(0, l.jsx)(S, {
														label: "Start",
														children: C.start_time
															? (0, r.r6)(C.start_time)
															: "—",
													}),
													(0, l.jsx)(S, {
														label: "End",
														children: C.end_time
															? (0, r.r6)(C.end_time)
															: "—",
													}),
													(C.recording_url_path || C.recording_url) &&
														(0, l.jsx)(S, {
															label: "Recording",
															children: (0, l.jsx)("audio", {
																className: "w-full max-w-md",
																controls: !0,
																src: String(
																	C.recording_url_path ||
																		C.recording_url
																),
															}),
														}),
													C._lead
														? (0, l.jsx)(S, {
																label: "Lead",
																children: (0, l.jsx)("button", {
																	type: "button",
																	className:
																		"text-primary underline-offset-2 hover:underline",
																	onClick: () =>
																		e("crm-lead-detail", {
																			id: String(C._lead),
																		}),
																	children: String(
																		C._lead_label || C._lead
																	),
																}),
														  })
														: null,
													C._contact
														? (0, l.jsx)(S, {
																label: "Contact",
																children: String(
																	C._contact_label || C._contact
																),
														  })
														: null,
													C._deal
														? (0, l.jsx)(S, {
																label: "Deal",
																children: (0, l.jsx)("button", {
																	type: "button",
																	className:
																		"text-primary underline-offset-2 hover:underline",
																	onClick: () =>
																		e(
																			"crm-opportunity-detail",
																			{ id: String(C._deal) }
																		),
																	children: String(
																		C._deal_label || C._deal
																	),
																}),
														  })
														: null,
												],
										  }),
								}),
							],
						}),
						et.length
							? (0, l.jsxs)(d.Zp, {
									className: "border-border/70 shadow-sm",
									children: [
										(0, l.jsx)(d.aR, {
											className: "pb-3",
											children: (0, l.jsx)(d.ZB, {
												className: "text-base",
												children: "Notes",
											}),
										}),
										(0, l.jsx)(d.Wu, {
											className: "space-y-3",
											children: et.map((e) =>
												(0, l.jsxs)(
													"div",
													{
														className:
															"rounded-md border border-border/70 p-3 text-sm",
														children: [
															(0, l.jsx)("div", {
																className: "font-medium",
																children: String(
																	e.title || "Note"
																),
															}),
															(0, l.jsx)("div", {
																className:
																	"mt-1 text-muted-foreground",
																dangerouslySetInnerHTML: {
																	__html: String(
																		e.content || ""
																	),
																},
															}),
														],
													},
													String(e.name)
												)
											),
										}),
									],
							  })
							: null,
						el.length
							? (0, l.jsxs)(d.Zp, {
									className: "border-border/70 shadow-sm",
									children: [
										(0, l.jsx)(d.aR, {
											className: "pb-3",
											children: (0, l.jsx)(d.ZB, {
												className: "text-base",
												children: "Linked Tasks",
											}),
										}),
										(0, l.jsx)(d.Wu, {
											className: "space-y-2",
											children: el.map((a) =>
												(0, l.jsxs)(
													"div",
													{
														className:
															"flex items-center justify-between rounded-md border border-border/70 px-3 py-2 text-sm",
														children: [
															(0, l.jsxs)("div", {
																children: [
																	(0, l.jsx)("div", {
																		className: "font-medium",
																		children: String(
																			a.subject || a.name
																		),
																	}),
																	(0, l.jsxs)("div", {
																		className:
																			"text-xs text-muted-foreground",
																		children: [
																			String(a.status || ""),
																			a.due_datetime
																				? ` \xb7 ${(0,
																				  r.r6)(
																						String(
																							a.due_datetime
																						)
																				  )}`
																				: "",
																		],
																	}),
																],
															}),
															(0, l.jsx)(c.$, {
																variant: "ghost",
																size: "sm",
																onClick: () => e("crm-activities"),
																children: "Open",
															}),
														],
													},
													String(a.name)
												)
											),
										}),
									],
							  })
							: null,
						(0, l.jsx)(g.z, {
							open: V,
							onOpenChange: I,
							title: et.length ? "Edit Note" : "Add Note",
							noteTitle: J,
							noteContent: G,
							onNoteTitleChange: W,
							onNoteContentChange: H,
							onSave: () => void eo(),
							saving: M,
							showTitleField: !0,
						}),
						(0, l.jsx)(g.I, {
							open: R,
							onOpenChange: q,
							subject: Y,
							notes: Q,
							due: U,
							onSubjectChange: P,
							onNotesChange: X,
							onDueChange: K,
							onSave: () => void ec(),
							saving: M,
						}),
					],
				});
			}
			function S({ label: e, children: a }) {
				return (0, l.jsxs)("div", {
					className: "grid gap-1 sm:grid-cols-[8rem_1fr] sm:items-center",
					children: [
						(0, l.jsx)("div", {
							className:
								"text-xs font-medium uppercase tracking-wide text-muted-foreground",
							children: e,
						}),
						(0, l.jsx)("div", { children: a }),
					],
				});
			}
			function w({ label: e, children: a }) {
				return (0, l.jsxs)("div", {
					className: "space-y-1.5",
					children: [
						(0, l.jsx)("label", {
							className: "text-xs font-medium text-muted-foreground",
							children: e,
						}),
						a,
					],
				});
			}
		},
		97426: (e, a, t) => {
			t.d(a, { x: () => g });
			var l = t(95155),
				r = t(12115),
				n = t(90901),
				s = t(44855),
				i = t(32144),
				o = t(10086),
				c = t(4474),
				d = t(39658),
				u = t(79792),
				m = t(74350),
				h = t(6296),
				x = t(66609);
			function g({
				value: e,
				onValueChange: a,
				valueLabel: t,
				placeholder: p = "Search contacts…",
				disabled: v,
				className: b,
				allowCreate: j = !0,
			}) {
				let { mutate: f } = (0, n.iX)(),
					[y, N] = (0, r.useState)(""),
					[_, C] = (0, r.useState)(t || ""),
					[S, w] = (0, r.useState)(!1),
					[k, A] = (0, r.useState)(!1),
					[$, L] = (0, r.useState)(""),
					[M, T] = (0, r.useState)(""),
					[F, D] = (0, r.useState)(""),
					[E, z] = (0, r.useState)(""),
					{ data: Z, isLoading: O } = (0, s.Ay)(["crm-link-contacts", y], () =>
						(0, i.ik)({ search: y || void 0, limit: 50 })
					),
					B = (0, r.useMemo)(
						() =>
							(Z?.data || []).map((e) => {
								let a =
									[e.first_name, e.last_name].filter(Boolean).join(" ") ||
									String(e.name);
								return {
									value: String(e.name),
									label: a,
									description: [e.mobile_no || e.phone, e.email_id, e.name]
										.filter(Boolean)
										.map(String)
										.join(" \xb7 "),
									mobile: String(e.mobile_no || e.phone || ""),
								};
							}),
						[Z]
					),
					V = (e && (_ || t)) || B.find((a) => a.value === e)?.label || void 0,
					I = async () => {
						if (!$.trim() && !M.trim())
							return void x.o.error("First name or last name is required");
						A(!0);
						try {
							let e = await (0, i.Qt)({
								first_name: $.trim(),
								last_name: M.trim(),
								mobile_no: F.trim() || void 0,
								email_id: E.trim() || void 0,
							});
							await f(
								(e) => Array.isArray(e) && String(e[0]).includes("contact"),
								void 0,
								{ revalidate: !0 }
							),
								C(e.label || e.name),
								a(e.name, e.label, { mobile: e.mobile || F.trim() }),
								w(!1),
								L(""),
								T(""),
								D(""),
								z(""),
								x.o.success(`Created: ${e.label || e.name}`);
						} catch (e) {
							x.o.error(e instanceof Error ? e.message : "Could not create contact");
						} finally {
							A(!1);
						}
					};
				return (0, l.jsxs)(l.Fragment, {
					children: [
						(0, l.jsx)(o.Zi, {
							className: b,
							options: B,
							value: e,
							valueLabel: V,
							onValueChange: (e) => {
								let t = B.find((a) => a.value === e),
									l = t?.label || "";
								C(l), a(e, l || void 0, { mobile: t?.mobile });
							},
							onSearchChange: N,
							placeholder: p,
							emptyMessage: "No contacts found",
							isLoading: O,
							disabled: v,
							onCreateNew: j && !v ? () => w(!0) : void 0,
							createNewLabel: "Create contact",
						}),
						(0, l.jsx)(m.lG, {
							open: S,
							onOpenChange: w,
							children: (0, l.jsxs)(m.Cf, {
								className: "sm:max-w-md",
								children: [
									(0, l.jsxs)(m.c7, {
										children: [
											(0, l.jsx)(m.L3, { children: "New contact" }),
											(0, l.jsx)(m.rr, {
												children:
													"Creates a Contact and selects it on this form.",
											}),
										],
									}),
									(0, l.jsxs)("div", {
										className: "grid gap-3 py-2",
										children: [
											(0, l.jsxs)("div", {
												className: "grid grid-cols-2 gap-2",
												children: [
													(0, l.jsxs)("div", {
														className: "space-y-1",
														children: [
															(0, l.jsx)(u.J, {
																children: "First name",
															}),
															(0, l.jsx)(d.p, {
																value: $,
																onChange: (e) => L(e.target.value),
															}),
														],
													}),
													(0, l.jsxs)("div", {
														className: "space-y-1",
														children: [
															(0, l.jsx)(u.J, {
																children: "Last name",
															}),
															(0, l.jsx)(d.p, {
																value: M,
																onChange: (e) => T(e.target.value),
															}),
														],
													}),
												],
											}),
											(0, l.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, l.jsx)(u.J, { children: "Mobile" }),
													(0, l.jsx)(d.p, {
														value: F,
														onChange: (e) => D(e.target.value),
													}),
												],
											}),
											(0, l.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, l.jsx)(u.J, { children: "Email" }),
													(0, l.jsx)(d.p, {
														type: "email",
														value: E,
														onChange: (e) => z(e.target.value),
													}),
												],
											}),
										],
									}),
									(0, l.jsxs)(m.Es, {
										children: [
											(0, l.jsx)(c.$, {
												type: "button",
												variant: "outline",
												onClick: () => w(!1),
												children: "Cancel",
											}),
											(0, l.jsx)(c.$, {
												type: "button",
												onClick: () => void I(),
												disabled: k,
												children: k
													? (0, l.jsx)(h.A, {
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
	},
]);
