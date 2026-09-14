import { Link } from "@/i18n/navigation";
import { A_COMPLETER, type Bloc } from "@/lib/legal-content";

/**
 * Rendu commun aux mentions légales et à la politique de confidentialité.
 *
 * Les marqueurs `[À compléter]` sont surlignés : sur une page légale, un trou doit se voir
 * au premier coup d'œil plutôt que se fondre dans le texte. Tant qu'il en reste un, la page
 * est publiée mais incomplète — c'est plus honnête qu'une identité inventée, et ça se repère
 * en la relisant.
 */
function Texte({ contenu }: { contenu: string }) {
  const morceaux = contenu.split(A_COMPLETER);
  return (
    <>
      {morceaux.map((m, i) => (
        <span key={i}>
          {m}
          {i < morceaux.length - 1 && (
            <mark
              className="px-1.5 py-0.5 rounded font-semibold"
              style={{ background: "rgba(232,163,61,0.18)", color: "var(--terracotta)" }}
            >
              {A_COMPLETER}
            </mark>
          )}
        </span>
      ))}
    </>
  );
}

export default function PageLegale({
  titre,
  intro,
  maj,
  blocs,
  accueil,
  filAriane,
}: {
  titre: string;
  intro: string;
  maj: string;
  blocs: Bloc[];
  accueil: string;
  filAriane: string;
}) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-xs mb-6" style={{ color: "var(--text-muted)" }} aria-label={filAriane}>
        <Link href="/" className="hover:underline">{accueil}</Link>
        <span className="mx-2">/</span>
        <span>{titre}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-3">{titre}</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{intro}</p>
        <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>{maj}</p>
      </header>

      <div className="flex flex-col gap-8">
        {blocs.map((bloc) => (
          <section key={bloc.titre}>
            <h2 className="text-lg font-semibold mb-3">{bloc.titre}</h2>

            {bloc.paragraphes?.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>
                <Texte contenu={p} />
              </p>
            ))}

            {bloc.tableau && (
              // Le tableau défile dans son propre conteneur : sur mobile, quatre colonnes de
              // texte ne tiennent pas, et c'est la page entière qui partirait de travers.
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="text-xs min-w-[34rem] w-full border-collapse">
                  <thead>
                    <tr>
                      {bloc.tableau.entetes.map((e) => (
                        <th
                          key={e}
                          scope="col"
                          className="text-left font-semibold p-2 align-bottom"
                          style={{ color: "var(--text)", borderBottom: "1px solid var(--line)" }}
                        >
                          {e}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bloc.tableau.lignes.map((ligne, i) => (
                      <tr key={i}>
                        {ligne.map((cell, j) => (
                          <td
                            key={j}
                            className="p-2 align-top leading-relaxed"
                            style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--line)" }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {bloc.puces && (
              <ul className="text-sm leading-relaxed list-disc pl-5 flex flex-col gap-1.5 mt-3" style={{ color: "var(--text-muted)" }}>
                {bloc.puces.map((p, i) => (
                  <li key={i}><Texte contenu={p} /></li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
