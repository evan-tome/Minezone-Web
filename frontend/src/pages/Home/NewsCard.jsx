import './home.css';

const NewsCard = ({ title, date, content, image, reverse }) => {
  return (
    <li className={reverse ? "reverse" : ""}>
      <div className="news-img-wrapper">
        <img src={image} alt={title} />
      </div>
      <div className="news-content">
        <h2>{title}</h2>
        <p className="date">{date}</p>
        <p>{content}</p>
      </div>
    </li>
  );
}

export default NewsCard;