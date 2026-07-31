import ReferenceCrud from '../components/ReferenceCrud';

export default function Cities() {
  return (
    <ReferenceCrud
      title="Cities"
      endpoint="cities"
      fields={[
        { name: 'name', placeholder: 'City name', required: true },
        { name: 'state', placeholder: 'State' },
      ]}
    />
  );
}
