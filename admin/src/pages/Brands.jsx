import ReferenceCrud from '../components/ReferenceCrud';

export default function Brands() {
  return (
    <ReferenceCrud
      title="Brands"
      endpoint="brands"
      fields={[
        { name: 'name', placeholder: 'Brand name (e.g. Maruti Suzuki)', required: true },
        { name: 'logo', type: 'file' },
      ]}
    />
  );
}
