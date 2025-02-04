import { useParams } from "react-router-dom";

const Chat = () => {
  const { id } = useParams();
  return <div>Chat {id}</div>;
};

export default Chat;