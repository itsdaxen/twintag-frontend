import Image from "next/image";

import { Container } from "@/components/layout/container";

interface Member {
  name: string;
  role: string;
  bio: string;
  photo: string;
}

const TEAM: Member[] = [
  {
    name: "Farzam Daghighi",
    role: "Engineering and product",
    bio: "Builds the recognition pipeline, spatial backend and product interface — and keeps every result traceable to the scan that produced it.",
    photo: "/team/farzam.jpg",
  },
  {
    name: "Sanni Leppasalo",
    role: "Design and communication",
    bio: "Shapes how the work reads, from the interface to the way a detected asset explains itself to someone who has to act on it.",
    photo: "/team/sanni.jpg",
  },
];

export function TeamGrid() {
  return (
    <section id="team" className="relative scroll-mt-20 border-t border-border">
      <Container className="py-20 lg:py-28">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="text-sm font-medium text-primary">Team</p>
          <h2 className="font-display mt-4 text-3xl font-light tracking-tight text-balance md:text-4xl">
            Built by people who care about making complex systems
            understandable.
          </h2>
        </div>
        <div className="mx-auto grid max-w-5xl divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {TEAM.map((member) => (
            <article
              key={member.name}
              className="px-0 py-12 text-center first:pt-0 last:pb-0 sm:px-10 sm:py-0 lg:px-14"
            >
              <Image
                src={member.photo}
                alt={member.name}
                width={320}
                height={320}
                className="mx-auto size-40 rounded-full object-cover lg:size-48"
              />
              <h2 className="font-display mt-8 text-2xl font-light tracking-tight lg:text-3xl">
                {member.name}
              </h2>
              <p className="mt-2 text-sm font-medium tracking-wide text-primary">
                {member.role}
              </p>
              <p className="mx-auto mt-5 max-w-sm leading-relaxed text-muted-foreground">
                {member.bio}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
