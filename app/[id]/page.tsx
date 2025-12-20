import SushiDetail from "@/app/[id]/_components/sushi-detail";

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;
    return <SushiDetail id={id} />;
}
